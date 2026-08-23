import Database from "@tauri-apps/plugin-sql";

const DATABASE_URL = "sqlite:rakit.db";
export const presetIdeaCategories = ["Inspirasi", "Konten", "Desain", "Bisnis", "Pribadi"];

export type Idea = {
  id: number;
  title: string;
  category: string;
  text_content: string | null;
  document_path: string | null;
  image_path: string | null;
  link_url: string | null;
  created_at: string;
  updated_at: string;
};

export type IdeaInput = Pick<Idea, "title" | "category" | "text_content" | "document_path" | "image_path" | "link_url">;

async function db() {
  return Database.load(DATABASE_URL);
}

export async function listIdeas() {
  return (await (await db()).select<Idea[]>(
    "SELECT id, title, category, text_content, document_path, image_path, link_url, created_at, updated_at FROM ideas ORDER BY updated_at DESC, id DESC",
  ));
}

export async function saveIdea(input: IdeaInput, id?: number) {
  const database = await db();
  if (id) {
    await database.execute(
      "UPDATE ideas SET title = $1, category = $2, text_content = $3, document_path = $4, image_path = $5, link_url = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7",
      [input.title, input.category, input.text_content, input.document_path, input.image_path, input.link_url, id],
    );
    return;
  }
  await database.execute(
    "INSERT INTO ideas (content_type, category, content, text_content, document_path, image_path, link_url, title) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    [input.text_content ? "text" : input.document_path ? "document" : input.image_path ? "image" : "link", input.category, input.text_content || input.document_path || input.image_path || input.link_url || "", input.text_content, input.document_path, input.image_path, input.link_url, input.title],
  );
}

export async function deleteIdea(id: number) {
  await (await db()).execute("DELETE FROM ideas WHERE id = $1", [id]);
}

export async function listIdeaCategories() {
  const rows = await (await db()).select<{ value: string }[]>("SELECT value FROM settings WHERE key = 'idea_categories'");
  try { const custom = JSON.parse(rows[0]?.value ?? "[]") as string[]; return [...new Set([...presetIdeaCategories, ...custom.filter(Boolean)])]; } catch { return presetIdeaCategories; }
}

export async function saveIdeaCategories(categories: string[]) {
  await (await db()).execute("INSERT INTO settings (key, value, updated_at) VALUES ('idea_categories', $1, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP", [JSON.stringify(categories)]);
}

export async function deleteIdeaCategory(category: string) {
  if (presetIdeaCategories.includes(category)) return;
  const database = await db();
  await database.execute("UPDATE ideas SET category = $1, updated_at = CURRENT_TIMESTAMP WHERE category = $2", [presetIdeaCategories[0], category]);
  const categories = await listIdeaCategories();
  await saveIdeaCategories(categories.filter((item) => item !== category));
}
