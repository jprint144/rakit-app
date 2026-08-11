import Database from "@tauri-apps/plugin-sql";
const db = () => Database.load("sqlite:rakit.db");
export const presetReferenceCategories = ["Umum", "Inspirasi", "Desain", "Belanja"];
export type ReferenceItem = { id: number; title: string; url: string; category: string; added_at: string; sort_order: number };
export async function listReferences() { return (await (await db()).select<ReferenceItem[]>("SELECT id, title, url, category, added_at, sort_order FROM reference_items ORDER BY sort_order, id")); }
export async function saveReference(title: string, url: string, category: string) { await (await db()).execute("INSERT INTO reference_items (title, url, category, sort_order) VALUES ($1, $2, $3, COALESCE((SELECT MAX(sort_order) + 1 FROM reference_items), 1))", [title, url, category]); }
export async function updateReference(id: number, title: string, url: string, category: string) { await (await db()).execute("UPDATE reference_items SET title = $1, url = $2, category = $3 WHERE id = $4", [title, url, category, id]); }
export async function deleteReference(id: number) { await (await db()).execute("DELETE FROM reference_items WHERE id = $1", [id]); }
export async function reorderReferences(ids: number[]) { const database = await db(); await Promise.all(ids.map((id, index) => database.execute("UPDATE reference_items SET sort_order = $1 WHERE id = $2", [index + 1, id]))); }
export async function listReferenceCategories() { const rows = await (await db()).select<{ value: string }[]>("SELECT value FROM settings WHERE key = 'reference_categories'"); try { const custom = JSON.parse(rows[0]?.value ?? "[]"); return [...presetReferenceCategories, ...custom.filter((item: unknown) => typeof item === "string")]; } catch { return presetReferenceCategories; } }
export async function saveReferenceCategories(categories: string[]) { const custom = categories.filter((item) => !presetReferenceCategories.includes(item)); await (await db()).execute("INSERT INTO settings (key, value, updated_at) VALUES ('reference_categories', $1, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP", [JSON.stringify(custom)]); }
