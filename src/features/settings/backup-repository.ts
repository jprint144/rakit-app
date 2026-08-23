import { appLocalDataDir, join } from "@tauri-apps/api/path";
import { BaseDirectory, exists, readFile, writeFile } from "@tauri-apps/plugin-fs";
import Database from "@tauri-apps/plugin-sql";

const DATABASE_URL = "sqlite:rakit.db";
const BACKUP_VERSION = 1;

const tables = {
  projects: ["id", "code", "name", "client_name", "client_whatsapp", "brief", "kanban_status", "payment_status", "deadline", "started_at", "folder_path", "archived", "created_at", "updated_at"],
  customer_orders: ["id", "project_id", "customer_name", "customer_whatsapp", "status", "created_at", "updated_at"],
  order_items: ["id", "order_id", "description", "quantity", "unit_price", "created_at"],
  transactions: ["id", "project_id", "type", "installment_name", "amount", "transaction_date", "notes", "created_at", "order_id"],
  invoices: ["id", "project_id", "number", "issued_at", "items_json", "last_export_format", "created_at", "order_id", "document_type"],
  ideas: ["id", "content_type", "category", "content", "created_at", "updated_at", "text_content", "document_path", "image_path", "link_url", "title"],
  reference_items: ["id", "url", "title", "category", "added_at", "sort_order"],
  settings: ["key", "value", "updated_at"],
} as const;

type TableName = keyof typeof tables;
type BackupRows = Record<TableName, Record<string, unknown>[]>;
type BackupAsset = { name: string; extension: string; data: string };

export type RakitBackup = {
  app: "Rakit";
  version: number;
  created_at: string;
  data: BackupRows;
  assets: BackupAsset[];
};

async function db() {
  return Database.load(DATABASE_URL);
}

function bytesToBase64(bytes: Uint8Array) {
  let value = "";
  for (let index = 0; index < bytes.length; index += 0x8000) value += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(value);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function backupAsset(path: string, name: string): Promise<BackupAsset | null> {
  if (!path || !(await exists(path))) return null;
  const extension = path.split(".").pop()?.toLowerCase();
  return { name, extension: extension && /^[a-z0-9]+$/.test(extension) ? extension : "png", data: bytesToBase64(await readFile(path)) };
}

function assertBackup(value: unknown): asserts value is RakitBackup {
  if (!value || typeof value !== "object") throw new Error("File backup tidak valid.");
  const backup = value as Partial<RakitBackup>;
  if (backup.app !== "Rakit" || backup.version !== BACKUP_VERSION || !backup.data || typeof backup.data !== "object") throw new Error("Versi file backup tidak didukung.");
  for (const table of Object.keys(tables) as TableName[]) if (!Array.isArray(backup.data[table])) throw new Error("Isi file backup tidak lengkap.");
  if (backup.assets !== undefined && (!Array.isArray(backup.assets) || backup.assets.some((asset) => !asset || typeof asset.name !== "string" || typeof asset.extension !== "string" || typeof asset.data !== "string"))) throw new Error("Lampiran file backup tidak valid.");
}

export function parseBackup(value: unknown): RakitBackup {
  assertBackup(value);
  return value;
}

export async function createBackup(): Promise<RakitBackup> {
  const database = await db();
  const data = {} as BackupRows;
  for (const table of Object.keys(tables) as TableName[]) data[table] = await database.select<Record<string, unknown>[]>(`SELECT ${tables[table].join(", ")} FROM ${table} ORDER BY rowid`);

  const settings = Object.fromEntries(data.settings.map((row) => [row.key, row.value]));
  const assets = (await Promise.all([
    backupAsset(typeof settings.logo_path === "string" ? settings.logo_path : "", "invoice-logo"),
    backupAsset(typeof settings.signature_path === "string" ? settings.signature_path : "", "invoice-signature"),
  ])).filter((asset): asset is BackupAsset => asset !== null);

  return { app: "Rakit", version: BACKUP_VERSION, created_at: new Date().toISOString(), data, assets };
}

async function restoreAssets(backup: RakitBackup) {
  const restoredPaths = new Map<string, string>();
  for (const asset of backup.assets ?? []) {
    const filename = `${asset.name}.${asset.extension}`;
    await writeFile(filename, base64ToBytes(asset.data), { baseDir: BaseDirectory.AppLocalData });
    restoredPaths.set(asset.name, await join(await appLocalDataDir(), filename));
  }
  return restoredPaths;
}

export async function restoreBackup(value: unknown) {
  const backup = parseBackup(value);
  const database = await db();
  const restoredPaths = await restoreAssets(backup);
  const rows = structuredClone(backup.data);
  for (const setting of rows.settings) {
    if (setting.key === "logo_path" && restoredPaths.has("invoice-logo")) setting.value = restoredPaths.get("invoice-logo")!;
    if (setting.key === "signature_path" && restoredPaths.has("invoice-signature")) setting.value = restoredPaths.get("invoice-signature")!;
  }

  await database.execute("BEGIN TRANSACTION");
  try {
    for (const table of ["invoices", "transactions", "order_items", "customer_orders", "projects", "ideas", "reference_items", "settings"] as TableName[]) await database.execute(`DELETE FROM ${table}`);
    for (const table of Object.keys(tables) as TableName[]) {
      const columns = tables[table];
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
      for (const row of rows[table]) await database.execute(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`, columns.map((column) => row[column] ?? null));
    }
    await database.execute("COMMIT");
  } catch (error) {
    await database.execute("ROLLBACK");
    throw error;
  }
}
