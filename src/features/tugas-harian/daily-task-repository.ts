import Database from "@tauri-apps/plugin-sql";

const DATABASE_URL = "sqlite:rakit.db";

export const taskPriorities = ["Rendah", "Normal", "Tinggi"] as const;
export type TaskPriority = (typeof taskPriorities)[number];

export type DailyTask = {
  id: number;
  sync_id: string | null;
  title: string;
  notes: string | null;
  task_date: string;
  task_time: string | null;
  priority: TaskPriority;
  category: string;
  completed: number;
  reminder_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type DailyTaskInput = Pick<DailyTask, "title" | "notes" | "task_date" | "task_time" | "priority" | "category" | "reminder_at">;

async function db() {
  return Database.load(DATABASE_URL);
}

export async function listDailyTasks() {
  return (await (await db()).select<DailyTask[]>(
    "SELECT id, sync_id, title, notes, task_date, task_time, priority, category, completed, reminder_at, created_at, updated_at, deleted_at FROM daily_tasks WHERE deleted_at IS NULL ORDER BY completed, task_date, COALESCE(task_time, '99:99'), id DESC",
  ));
}

export async function listDailyTasksForSync() {
  return (await (await db()).select<DailyTask[]>(
    "SELECT id, sync_id, title, notes, task_date, task_time, priority, category, completed, reminder_at, created_at, updated_at, deleted_at FROM daily_tasks ORDER BY id",
  ));
}

export async function saveDailyTask(input: DailyTaskInput, id?: number) {
  const database = await db();
  const values = [input.title.trim(), input.notes?.trim() || null, input.task_date, input.task_time || null, input.priority, input.category.trim() || "Pribadi", input.reminder_at || null];
  if (id) {
    await database.execute(
      "UPDATE daily_tasks SET title = $1, notes = $2, task_date = $3, task_time = $4, priority = $5, category = $6, reminder_at = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8",
      [...values, id],
    );
    return;
  }
  await database.execute(
    "INSERT INTO daily_tasks (sync_id, title, notes, task_date, task_time, priority, category, reminder_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    [crypto.randomUUID(), ...values],
  );
}

export async function setDailyTaskCompleted(id: number, completed: boolean) {
  await (await db()).execute("UPDATE daily_tasks SET completed = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [completed ? 1 : 0, id]);
}

export async function deleteDailyTask(id: number) {
  await (await db()).execute("UPDATE daily_tasks SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
}

export async function assignDailyTaskSyncId(id: number, syncId: string) {
  await (await db()).execute("UPDATE daily_tasks SET sync_id = $1 WHERE id = $2", [syncId, id]);
}

export async function upsertRemoteDailyTask(task: DailyTask) {
  const database = await db();
  const existing = await database.select<Pick<DailyTask, "id" | "updated_at">[]>("SELECT id, updated_at FROM daily_tasks WHERE sync_id = $1", [task.sync_id]);
  if (existing[0] && Date.parse(existing[0].updated_at) > Date.parse(task.updated_at)) return false;
  const values = [task.title, task.notes, task.task_date, task.task_time, task.priority, task.category, task.completed, task.reminder_at, task.created_at, task.updated_at, task.deleted_at, task.sync_id];
  if (existing[0]) {
    await database.execute("UPDATE daily_tasks SET title = $1, notes = $2, task_date = $3, task_time = $4, priority = $5, category = $6, completed = $7, reminder_at = $8, created_at = $9, updated_at = $10, deleted_at = $11 WHERE sync_id = $12", values);
  } else {
    await database.execute("INSERT INTO daily_tasks (title, notes, task_date, task_time, priority, category, completed, reminder_at, created_at, updated_at, deleted_at, sync_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)", values);
  }
  return true;
}
