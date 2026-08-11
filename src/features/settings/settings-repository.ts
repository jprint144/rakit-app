import Database from "@tauri-apps/plugin-sql";

const DATABASE_URL = "sqlite:rakit.db";
const PROJECTS_ROOT_KEY = "projects_root";
export const defaultProjectsRoot = "D:\\#0 JOBS\\RAKIT-V2.0.0";

async function db() { return Database.load(DATABASE_URL); }

export async function loadProjectsRoot() {
  const rows = await (await db()).select<{ value: string }[]>("SELECT value FROM settings WHERE key = $1", [PROJECTS_ROOT_KEY]);
  return rows[0]?.value || defaultProjectsRoot;
}

export async function saveProjectsRoot(path: string) {
  await (await db()).execute("INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP", [PROJECTS_ROOT_KEY, path]);
}

export type AppTheme = "light" | "dark";

export async function loadTheme(): Promise<AppTheme> {
  const rows = await (await db()).select<{ value: string }[]>("SELECT value FROM settings WHERE key = 'theme'");
  return rows[0]?.value === "dark" ? "dark" : "light";
}

export async function saveTheme(theme: AppTheme) {
  await (await db()).execute("INSERT INTO settings (key, value, updated_at) VALUES ('theme', $1, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP", [theme]);
}
