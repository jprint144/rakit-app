import Database from "@tauri-apps/plugin-sql";

const DATABASE_URL = "sqlite:rakit.db";

export const habitTrackerTypes = ["checklist", "number"] as const;
export type HabitTrackerType = (typeof habitTrackerTypes)[number];

export const habitCategories = ["Kesehatan", "Produktivitas", "Belajar", "Spiritual", "Pribadi"] as const;

export type HabitTracker = {
  id: number;
  name: string;
  notes: string | null;
  category: string;
  color: string;
  tracking_type: HabitTrackerType;
  target_monthly: number;
  start_date: string;
  end_date: string;
  archived: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type HabitTrackerInput = Pick<HabitTracker, "name" | "notes" | "category" | "color" | "tracking_type" | "target_monthly" | "start_date" | "end_date">;

export type HabitEntry = {
  id: number;
  tracker_id: number;
  entry_date: string;
  completed: number;
  value_number: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

async function db() {
  return Database.load(DATABASE_URL);
}

let schemaReady = false;
async function ensureHabitSchema() {
  if (schemaReady) return;
  const database = await db();
  const columns = await database.select<{ name: string }[]>("PRAGMA table_info(habit_trackers)");
  if (!columns.some((column) => column.name === "start_date")) {
    await database.execute("ALTER TABLE habit_trackers ADD COLUMN start_date TEXT");
  }
  if (!columns.some((column) => column.name === "end_date")) {
    await database.execute("ALTER TABLE habit_trackers ADD COLUMN end_date TEXT");
  }
  schemaReady = true;
}

function localDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function addOneMonth(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return localDate();
  const next = new Date(year, month, day);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}

function safeColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : "#60a5fa";
}

export async function listHabitTrackers() {
  await ensureHabitSchema();
  return (await (await db()).select<HabitTracker[]>(
    "SELECT id, name, notes, category, color, tracking_type, target_monthly, COALESCE(start_date, substr(created_at, 1, 10), date('now')) AS start_date, COALESCE(end_date, date(COALESCE(start_date, substr(created_at, 1, 10), date('now')), '+1 month')) AS end_date, archived, created_at, updated_at, deleted_at FROM habit_trackers WHERE deleted_at IS NULL AND archived = 0 ORDER BY updated_at DESC, id DESC",
  ));
}

export async function saveHabitTracker(input: HabitTrackerInput, id?: number) {
  await ensureHabitSchema();
  const startDate = input.start_date || localDate();
  const endDate = input.end_date && input.end_date >= startDate ? input.end_date : addOneMonth(startDate);
  const values = [
    input.name.trim(),
    input.notes?.trim() || null,
    input.category.trim() || "Pribadi",
    safeColor(input.color),
    habitTrackerTypes.includes(input.tracking_type) ? input.tracking_type : "checklist",
    Math.max(0, Number(input.target_monthly) || 0),
    startDate,
    endDate,
  ];

  if (id) {
    await (await db()).execute(
      "UPDATE habit_trackers SET name = $1, notes = $2, category = $3, color = $4, tracking_type = $5, target_monthly = $6, start_date = $7, end_date = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9",
      [...values, id],
    );
    return;
  }

  await (await db()).execute(
    "INSERT INTO habit_trackers (name, notes, category, color, tracking_type, target_monthly, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    values,
  );
}

export async function deleteHabitTracker(id: number) {
  await (await db()).execute("UPDATE habit_trackers SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
}

export async function listHabitEntries(monthStart: string, monthEnd: string) {
  return (await (await db()).select<HabitEntry[]>(
    "SELECT id, tracker_id, entry_date, completed, value_number, note, created_at, updated_at FROM habit_entries WHERE entry_date >= $1 AND entry_date <= $2 ORDER BY entry_date",
    [monthStart, monthEnd],
  ));
}

export async function toggleHabitChecklistEntry(trackerId: number, entryDate: string, completed: boolean) {
  await (await db()).execute(
    "INSERT INTO habit_entries (tracker_id, entry_date, completed, value_number, note) VALUES ($1, $2, $3, NULL, NULL) ON CONFLICT(tracker_id, entry_date) DO UPDATE SET completed = excluded.completed, updated_at = CURRENT_TIMESTAMP",
    [trackerId, entryDate, completed ? 1 : 0],
  );
}

export async function saveHabitNumberEntry(trackerId: number, entryDate: string, value: number | null, note: string | null) {
  const completed = value !== null && Number.isFinite(value) && value > 0;
  await (await db()).execute(
    "INSERT INTO habit_entries (tracker_id, entry_date, completed, value_number, note) VALUES ($1, $2, $3, $4, $5) ON CONFLICT(tracker_id, entry_date) DO UPDATE SET completed = excluded.completed, value_number = excluded.value_number, note = excluded.note, updated_at = CURRENT_TIMESTAMP",
    [trackerId, entryDate, completed ? 1 : 0, value, note?.trim() || null],
  );
}
