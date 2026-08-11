import { basename, dirname, join } from "@tauri-apps/api/path";
import { mkdir, rename } from "@tauri-apps/plugin-fs";
import { loadProjectsRoot } from "@/features/settings/settings-repository";

function clientSlug(clientName: string) {
  const slug = clientName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || "klien";
}

export function createProjectFolderName(code: string, clientName: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `${code}-${clientSlug(clientName)}-${date}`;
}

export async function createProjectFolder(code: string, clientName: string) {
  const projectsRoot = await loadProjectsRoot();
  const folderName = createProjectFolderName(code, clientName);
  const folderPath = await join(projectsRoot, folderName);

  await mkdir(folderPath, { recursive: true });

  return folderPath;
}

export async function moveProjectFolderToArchive(folderPath: string) {
  const projectRoot = await dirname(folderPath);
  const archiveRoot = await join(projectRoot, "Arsip");
  const folderName = await basename(folderPath);
  const archivedPath = await join(archiveRoot, folderName);
  await mkdir(archiveRoot, { recursive: true });
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await rename(folderPath, archivedPath);
      return archivedPath;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 350));
    }
  }
  throw lastError;
}

export async function restoreProjectFolder(folderPath: string) {
  const folderName = await basename(folderPath);
  const archiveRoot = await dirname(folderPath);
  const projectRoot = await dirname(archiveRoot);
  const restoredPath = await join(projectRoot, folderName);
  await rename(folderPath, restoredPath);
  return restoredPath;
}

export function isProjectFolderInArchive(folderPath: string) {
  return folderPath.replaceAll("/", "\\").toLowerCase().includes("\\arsip\\");
}
