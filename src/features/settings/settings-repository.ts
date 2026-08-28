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

export const sidebarFolderNames = ["Kelola kerja", "Pribadi", "Eksplorasi", "Lainnya"] as const;
export type SidebarFolderName = typeof sidebarFolderNames[number];
export type SidebarFolderColors = Record<SidebarFolderName, string>;
export const defaultSidebarFolderColors: SidebarFolderColors = {
  "Kelola kerja": "#38bdf8",
  Pribadi: "#a78bfa",
  Eksplorasi: "#fbbf24",
  Lainnya: "#94a3b8",
};

export type SidebarFolderItem = { label: string; url: string; color: string };
export type SidebarFolderConfig = { id: SidebarFolderName; name: string; color: string; items: SidebarFolderItem[] };
export type SidebarShortcutConfig = SidebarFolderItem;
export const defaultSidebarShortcuts: SidebarShortcutConfig[] = [
  { label: "Dashboard", url: "/", color: "#38bdf8" },
  { label: "Project", url: "/project", color: "#38bdf8" },
  { label: "Keuangan", url: "/finance", color: "#34d399" },
  { label: "Tugas Harian", url: "/tugas-harian", color: "#a78bfa" },
];
export const defaultSidebarFolders: SidebarFolderConfig[] = [
  { id: "Kelola kerja", name: "Kelola kerja", color: defaultSidebarFolderColors["Kelola kerja"], items: [{ label: "Project", url: "/project", color: "#38bdf8" }, { label: "Keuangan", url: "/finance", color: "#34d399" }, { label: "Invoice / Nota", url: "/invoice", color: "#fbbf24" }] },
  { id: "Pribadi", name: "Pribadi", color: defaultSidebarFolderColors.Pribadi, items: [{ label: "Tugas Harian", url: "/tugas-harian", color: "#a78bfa" }, { label: "Lamar Pekerjaan", url: "/lamar-pekerjaan", color: "#60a5fa" }, { label: "Habit Tracker", url: "/habit-tracker", color: "#34d399" }, { label: "Target", url: "/target", color: "#f59e0b" }] },
  { id: "Eksplorasi", name: "Eksplorasi", color: defaultSidebarFolderColors.Eksplorasi, items: [{ label: "Idea", url: "/idea", color: "#fbbf24" }, { label: "Reference", url: "/reference", color: "#fb7185" }] },
  { id: "Lainnya", name: "Lainnya", color: defaultSidebarFolderColors.Lainnya, items: [{ label: "Archive", url: "/archive", color: "#94a3b8" }, { label: "Settings", url: "/settings", color: "#cbd5e1" }] },
];

export async function loadSidebarFolders(): Promise<SidebarFolderConfig[]> {
  const rows = await (await db()).select<{ value: string }[]>("SELECT value FROM settings WHERE key = 'sidebar_folders'");
  try {
    const saved = JSON.parse(rows[0]?.value ?? "[]") as Partial<SidebarFolderConfig>[];
    return defaultSidebarFolders.map((fallback) => {
      const current = saved.find((item) => item.id === fallback.id);
      return {
        id: fallback.id,
        name: typeof current?.name === "string" && current.name.trim() ? current.name.trim() : fallback.name,
        color: typeof current?.color === "string" && /^#[0-9a-f]{6}$/i.test(current.color) ? current.color : fallback.color,
        items: fallback.items.map((item) => {
          const custom = current?.items?.find((candidate) => candidate?.url === item.url);
          return { ...item, label: typeof custom?.label === "string" && custom.label.trim() ? custom.label.trim() : item.label, color: typeof custom?.color === "string" && /^#[0-9a-f]{6}$/i.test(custom.color) ? custom.color : item.color };
        }),
      };
    });
  } catch {
    return defaultSidebarFolders;
  }
}

export async function saveSidebarFolders(folders: SidebarFolderConfig[]) {
  await (await db()).execute("INSERT INTO settings (key, value, updated_at) VALUES ('sidebar_folders', $1, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP", [JSON.stringify(folders)]);
}

export async function loadSidebarShortcuts(): Promise<SidebarShortcutConfig[]> {
  const rows = await (await db()).select<{ value: string }[]>("SELECT value FROM settings WHERE key = 'sidebar_shortcuts'");
  try {
    const saved = JSON.parse(rows[0]?.value ?? "[]") as Partial<SidebarShortcutConfig>[];
    return defaultSidebarShortcuts.map((fallback) => {
      const current = saved.find((item) => item.url === fallback.url);
      return { ...fallback, label: typeof current?.label === "string" && current.label.trim() ? current.label.trim() : fallback.label, color: typeof current?.color === "string" && /^#[0-9a-f]{6}$/i.test(current.color) ? current.color : fallback.color };
    });
  } catch { return defaultSidebarShortcuts; }
}

export async function saveSidebarShortcuts(shortcuts: SidebarShortcutConfig[]) {
  await (await db()).execute("INSERT INTO settings (key, value, updated_at) VALUES ('sidebar_shortcuts', $1, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at", [JSON.stringify(shortcuts)]);
}

export async function loadSidebarFolderColors(): Promise<SidebarFolderColors> {
  const rows = await (await db()).select<{ value: string }[]>("SELECT value FROM settings WHERE key = 'sidebar_folder_colors'");
  try {
    const saved = JSON.parse(rows[0]?.value ?? "{}") as Partial<SidebarFolderColors>;
    return Object.fromEntries(sidebarFolderNames.map((name) => [name, /^#[0-9a-f]{6}$/i.test(saved[name] ?? "") ? saved[name] : defaultSidebarFolderColors[name]])) as SidebarFolderColors;
  } catch {
    return defaultSidebarFolderColors;
  }
}

export async function saveSidebarFolderColors(colors: SidebarFolderColors) {
  await (await db()).execute("INSERT INTO settings (key, value, updated_at) VALUES ('sidebar_folder_colors', $1, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP", [JSON.stringify(colors)]);
}

export async function loadTheme(): Promise<AppTheme> {
  const rows = await (await db()).select<{ value: string }[]>("SELECT value FROM settings WHERE key = 'theme'");
  return rows[0]?.value === "dark" ? "dark" : "light";
}

export async function saveTheme(theme: AppTheme) {
  await (await db()).execute("INSERT INTO settings (key, value, updated_at) VALUES ('theme', $1, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP", [theme]);
}
