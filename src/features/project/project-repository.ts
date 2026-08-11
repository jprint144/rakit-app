import Database from "@tauri-apps/plugin-sql";
import { remove } from "@tauri-apps/plugin-fs";
import { createProjectFolder, isProjectFolderInArchive, moveProjectFolderToArchive, restoreProjectFolder } from "@/features/project/project-folders";

const DATABASE_URL = "sqlite:rakit.db";

export type Project = { id: number; code: string; name: string; client_name: string; client_whatsapp: string | null; brief: string | null; kanban_status: string; payment_status: string; deadline: string | null; started_at: string; folder_path: string | null };
export type ProjectInput = Omit<Project, "id" | "code" | "folder_path">;

async function db() { return Database.load(DATABASE_URL); }

export async function listProjects() {
  return (await (await db()).select<Project[]>("SELECT id, code, name, client_name, client_whatsapp, brief, kanban_status, payment_status, deadline, started_at, folder_path FROM projects WHERE archived = 0 ORDER BY id DESC"));
}

export async function listArchivedProjects() {
  return (await (await db()).select<Project[]>("SELECT id, code, name, client_name, client_whatsapp, brief, kanban_status, payment_status, deadline, started_at, folder_path FROM projects WHERE archived = 1 ORDER BY updated_at DESC"));
}

export async function archiveProject(project: Project) {
  if (project.kanban_status !== "done") throw new Error("Hanya project berstatus Selesai yang dapat diarsipkan.");

  const originalFolderPath = project.folder_path;
  let archivedFolderPath = originalFolderPath;
  let folderWarning = "";
  let folderMoved = false;
  if (originalFolderPath) {
    try {
      archivedFolderPath = await moveProjectFolderToArchive(originalFolderPath);
      folderMoved = true;
    } catch (error) {
      folderWarning = error instanceof Error ? error.message : String(error);
    }
  }

  try {
    await (await db()).execute(
      "UPDATE projects SET archived = 1, folder_path = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [archivedFolderPath, project.id],
    );
  } catch (error) {
    if (folderMoved && archivedFolderPath && originalFolderPath) {
      try {
        await restoreProjectFolder(archivedFolderPath);
      } catch (rollbackError) {
        console.error("Folder project gagal dikembalikan setelah arsip database gagal", rollbackError);
      }
    }
    throw error;
  }

  return { folderMoved, folderWarning };
}

export async function restoreProject(project: Project) {
  const folderPath = project.folder_path && isProjectFolderInArchive(project.folder_path)
    ? await restoreProjectFolder(project.folder_path)
    : project.folder_path;
  await (await db()).execute("UPDATE projects SET archived = 0, folder_path = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [folderPath, project.id]);
}

export async function moveArchivedProjectFolder(project: Project) {
  if (!project.folder_path || isProjectFolderInArchive(project.folder_path)) return project.folder_path;
  const folderPath = await moveProjectFolderToArchive(project.folder_path);
  await (await db()).execute("UPDATE projects SET folder_path = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND archived = 1", [folderPath, project.id]);
  return folderPath;
}

export async function saveProject(input: ProjectInput, id?: number) {
  const database = await db();
  if (id) {
    await database.execute("UPDATE projects SET name = $1, client_name = $2, client_whatsapp = $3, brief = $4, kanban_status = $5, payment_status = $6, deadline = $7, started_at = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9", [input.name, input.client_name, input.client_whatsapp, input.brief, input.kanban_status, input.payment_status, input.deadline, input.started_at, id]);
    return;
  }

  const next = await database.select<{ next_code: number }[]>("SELECT COALESCE((SELECT seq FROM sqlite_sequence WHERE name = 'projects'), 0) + 1 AS next_code");
  const code = `RKT-${String(next[0]?.next_code ?? 1).padStart(3, "0")}`;
  const deadline = input.deadline || null;
  const folderPath = await createProjectFolder(code, input.client_name);

  await database.execute("INSERT INTO projects (code, name, client_name, client_whatsapp, brief, kanban_status, payment_status, deadline, started_at, folder_path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", [code, input.name, input.client_name, input.client_whatsapp, input.brief, input.kanban_status, input.payment_status, deadline, input.started_at || new Date().toISOString(), folderPath]);
}

export async function deleteProject(project: Project) { await (await db()).execute("DELETE FROM projects WHERE id = $1", [project.id]); if (project.folder_path) { try { await remove(project.folder_path, { recursive: true }); } catch (error) { console.warn("Folder project tidak dapat dihapus", error); } } }
export async function updateProjectStatus(id: number, status: string) { await (await db()).execute("UPDATE projects SET kanban_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [status, id]); }

export async function updateProjectPaymentStatus(id: number, status: string) { await (await db()).execute("UPDATE projects SET payment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [status, id]); }

export async function updateProjectBrief(id: number, brief: string) { await (await db()).execute("UPDATE projects SET brief = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [brief, id]); }
