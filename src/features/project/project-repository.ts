import Database from "@tauri-apps/plugin-sql";
import { remove } from "@tauri-apps/plugin-fs";
import { createProjectFolder } from "@/features/project/project-folders";

const DATABASE_URL = "sqlite:rakit.db";

export type Project = { id: number; code: string; name: string; client_name: string; client_whatsapp: string | null; brief: string | null; kanban_status: string; payment_status: string; deadline: string | null; started_at: string; folder_path: string | null };
export type ProjectInput = Omit<Project, "id" | "code" | "folder_path">;

async function db() { return Database.load(DATABASE_URL); }

export async function listProjects() {
  return (await (await db()).select<Project[]>("SELECT id, code, name, client_name, client_whatsapp, brief, kanban_status, payment_status, deadline, started_at, folder_path FROM projects WHERE archived = 0 ORDER BY id DESC"));
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
