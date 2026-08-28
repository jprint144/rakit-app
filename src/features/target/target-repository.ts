import Database from "@tauri-apps/plugin-sql";

const DATABASE_URL = "sqlite:rakit.db";

export const targetTypes = ["item", "achievement"] as const;
export type TargetType = (typeof targetTypes)[number];

export const targetCategories = ["Barang", "Karier", "Skill", "Keuangan", "Pribadi"] as const;
export const targetPriorities = ["Rendah", "Normal", "Tinggi"] as const;
export type TargetPriority = (typeof targetPriorities)[number];

export const targetStatuses = ["Rencana", "Berjalan", "Tercapai", "Ditunda"] as const;
export type TargetStatus = (typeof targetStatuses)[number];

export type PersonalTarget = {
  id: number;
  title: string;
  type: TargetType;
  category: string;
  target_value: number;
  current_value: number;
  unit: string | null;
  deadline: string | null;
  priority: TargetPriority;
  status: TargetStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type PersonalTargetInput = Pick<PersonalTarget, "title" | "type" | "category" | "target_value" | "current_value" | "unit" | "deadline" | "priority" | "status" | "notes">;

export type PersonalTargetStep = {
  id: number;
  target_id: number;
  title: string;
  completed: number;
  sort_order: number;
};

export type PersonalTargetStepInput = Pick<PersonalTargetStep, "title"> & Partial<Pick<PersonalTargetStep, "id" | "completed">>;

async function db() {
  return Database.load(DATABASE_URL);
}

let schemaReady = false;
async function ensureTargetSchema() {
  if (schemaReady) return;
  await (await db()).execute(`
    CREATE TABLE IF NOT EXISTS personal_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'achievement' CHECK(type IN ('item', 'achievement')),
      category TEXT NOT NULL DEFAULT 'Pribadi',
      target_value INTEGER NOT NULL DEFAULT 0,
      current_value INTEGER NOT NULL DEFAULT 0,
      unit TEXT,
      deadline TEXT,
      priority TEXT NOT NULL DEFAULT 'Normal' CHECK(priority IN ('Rendah', 'Normal', 'Tinggi')),
      status TEXT NOT NULL DEFAULT 'Rencana' CHECK(status IN ('Rencana', 'Berjalan', 'Tercapai', 'Ditunda')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    )
  `);
  schemaReady = true;
}

function safeType(value: string): TargetType {
  return targetTypes.includes(value as TargetType) ? value as TargetType : "achievement";
}

function safePriority(value: string): TargetPriority {
  return targetPriorities.includes(value as TargetPriority) ? value as TargetPriority : "Normal";
}

function safeStatus(value: string): TargetStatus {
  return targetStatuses.includes(value as TargetStatus) ? value as TargetStatus : "Rencana";
}

function normalizeInput(input: PersonalTargetInput) {
  const targetValue = Math.max(0, Math.round(Number(input.target_value) || 0));
  const currentValue = Math.max(0, Math.round(Number(input.current_value) || 0));
  const status = targetValue > 0 && currentValue >= targetValue ? "Tercapai" : safeStatus(input.status);
  return [
    input.title.trim(),
    safeType(input.type),
    input.category.trim() || "Pribadi",
    targetValue,
    currentValue,
    input.unit?.trim() || null,
    input.deadline || null,
    safePriority(input.priority),
    status,
    input.notes?.trim() || null,
  ];
}

export async function listPersonalTargets() {
  await ensureTargetSchema();
  return (await (await db()).select<PersonalTarget[]>(
    "SELECT id, title, type, category, target_value, current_value, unit, deadline, priority, status, notes, created_at, updated_at, deleted_at FROM personal_targets WHERE deleted_at IS NULL ORDER BY CASE status WHEN 'Berjalan' THEN 0 WHEN 'Rencana' THEN 1 WHEN 'Ditunda' THEN 2 ELSE 3 END, COALESCE(deadline, '9999-12-31'), updated_at DESC, id DESC",
  ));
}

export async function savePersonalTarget(input: PersonalTargetInput, id?: number) {
  await ensureTargetSchema();
  const values = normalizeInput(input);
  if (id) {
    await (await db()).execute(
      "UPDATE personal_targets SET title = $1, type = $2, category = $3, target_value = $4, current_value = $5, unit = $6, deadline = $7, priority = $8, status = $9, notes = $10, updated_at = CURRENT_TIMESTAMP WHERE id = $11",
      [...values, id],
    );
    return id;
  }

  const database = await db();
  await database.execute(
    "INSERT INTO personal_targets (title, type, category, target_value, current_value, unit, deadline, priority, status, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
    values,
  );
  const rows = await database.select<{ id: number }[]>("SELECT last_insert_rowid() AS id");
  return rows[0].id;
}

export async function createPersonalTargetSteps(targetId: number, count: number, unit?: string | null) {
  await ensureTargetSchema();
  const database = await db();
  const steps = Math.max(1, Math.round(Number(count) || 1));
  const label = unit?.trim() || "Langkah";
  for (let index = 1; index <= steps; index += 1) {
    await database.execute(
      "INSERT INTO personal_target_steps (target_id, title, sort_order) VALUES ($1, $2, $3)",
      [targetId, `${label} ${index}`, index],
    );
  }
}

export async function savePersonalTargetSteps(targetId: number, inputSteps: PersonalTargetStepInput[]) {
  await ensureTargetSchema();
  const database = await db();
  const steps = inputSteps.map((step) => ({ ...step, title: step.title.trim() })).filter((step) => step.title);
  const existing = await database.select<PersonalTargetStep[]>("SELECT id, target_id, title, completed, sort_order FROM personal_target_steps WHERE target_id = $1", [targetId]);
  const retainedIds = new Set(steps.flatMap((step) => step.id ? [step.id] : []));
  for (const step of existing) if (!retainedIds.has(step.id)) await database.execute("DELETE FROM personal_target_steps WHERE id = $1", [step.id]);
  for (const [index, step] of steps.entries()) {
    if (step.id) {
      await database.execute("UPDATE personal_target_steps SET title = $1, sort_order = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3", [step.title, index + 1, step.id]);
    } else {
      await database.execute("INSERT INTO personal_target_steps (target_id, title, completed, sort_order) VALUES ($1, $2, $3, $4)", [targetId, step.title, step.completed ? 1 : 0, index + 1]);
    }
  }
  const totals = await database.select<{ total: number; completed: number }[]>("SELECT COUNT(*) AS total, COALESCE(SUM(completed), 0) AS completed FROM personal_target_steps WHERE target_id = $1", [targetId]);
  const total = Number(totals[0]?.total) || 0;
  const completed = Number(totals[0]?.completed) || 0;
  await database.execute("UPDATE personal_targets SET target_value = $1, current_value = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4", [total, completed, total > 0 && completed === total ? "Tercapai" : "Berjalan", targetId]);
}

export async function listPersonalTargetSteps() {
  await ensureTargetSchema();
  return (await (await db()).select<PersonalTargetStep[]>(
    "SELECT id, target_id, title, completed, sort_order FROM personal_target_steps ORDER BY target_id, sort_order, id",
  ));
}

export async function togglePersonalTargetStep(step: PersonalTargetStep, completed: boolean) {
  await ensureTargetSchema();
  const database = await db();
  await database.execute("UPDATE personal_target_steps SET completed = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [completed ? 1 : 0, step.id]);
  const totals = await database.select<{ total: number; completed: number }[]>(
    "SELECT COUNT(*) AS total, COALESCE(SUM(completed), 0) AS completed FROM personal_target_steps WHERE target_id = $1",
    [step.target_id],
  );
  const total = Number(totals[0]?.total) || 0;
  const completedCount = Number(totals[0]?.completed) || 0;
  await database.execute(
    "UPDATE personal_targets SET target_value = $1, current_value = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4",
    [total, completedCount, total > 0 && completedCount === total ? "Tercapai" : "Berjalan", step.target_id],
  );
}

export async function updatePersonalTargetProgress(id: number, currentValue: number) {
  await ensureTargetSchema();
  const rows = await (await db()).select<{ target_value: number; status: TargetStatus }[]>("SELECT target_value, status FROM personal_targets WHERE id = $1", [id]);
  const targetValue = Math.max(0, Number(rows[0]?.target_value) || 0);
  const nextValue = Math.max(0, Math.round(Number(currentValue) || 0));
  const nextStatus: TargetStatus = targetValue > 0 && nextValue >= targetValue ? "Tercapai" : rows[0]?.status === "Tercapai" ? "Berjalan" : rows[0]?.status ?? "Berjalan";
  await (await db()).execute("UPDATE personal_targets SET current_value = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3", [nextValue, nextStatus, id]);
}

export async function deletePersonalTarget(id: number) {
  await ensureTargetSchema();
  await (await db()).execute("UPDATE personal_targets SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
}
