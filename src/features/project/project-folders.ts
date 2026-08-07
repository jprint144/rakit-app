import { join } from "@tauri-apps/api/path";
import { mkdir } from "@tauri-apps/plugin-fs";

const PROJECTS_ROOT = "D:\\#0 JOBS\\RAKIT-V2.0.0";

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
  const folderName = createProjectFolderName(code, clientName);
  const folderPath = await join(PROJECTS_ROOT, folderName);

  await mkdir(folderPath, { recursive: true });

  return folderPath;
}