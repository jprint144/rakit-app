import {
  assignDailyTaskSyncId,
  listDailyTasksForSync,
  type DailyTask,
  upsertRemoteDailyTask,
} from "@/features/tugas-harian/daily-task-repository";
import {
  assignIdeaSyncId,
  listIdeasForSync,
  type Idea,
  upsertRemoteIdea,
} from "@/features/idea/idea-repository";
import { supabase } from "@/lib/supabase";
import { syncMonitorSnapshot } from "@/features/sync/monitor-sync";

type SyncDomain = "daily_tasks" | "ideas";
type RemoteRecord = { domain: SyncDomain; payload: DailyTask | Idea };
export type SyncResult = { pushed: number; pulled: number };

async function prepareTasks() {
  const tasks = await listDailyTasksForSync();
  for (const task of tasks) if (!task.sync_id) {
    const syncId = crypto.randomUUID();
    await assignDailyTaskSyncId(task.id, syncId);
    task.sync_id = syncId;
  }
  return tasks;
}

async function prepareIdeas() {
  const ideas = await listIdeasForSync();
  for (const idea of ideas) if (!idea.sync_id) {
    const syncId = crypto.randomUUID();
    await assignIdeaSyncId(idea.id, syncId);
    idea.sync_id = syncId;
  }
  return ideas;
}

export async function syncRakitEditableData(): Promise<SyncResult> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Masuk ke akun terlebih dahulu untuk menyinkronkan data.");

  const { data: remote, error } = await supabase.from("rakit_records").select("domain, payload").in("domain", ["daily_tasks", "ideas"]);
  if (error) throw error;
  let pulled = 0;
  for (const record of (remote ?? []) as RemoteRecord[]) {
    if (record.domain === "daily_tasks") {
      const task = record.payload as DailyTask;
      if (task.sync_id && await upsertRemoteDailyTask(task)) pulled += 1;
    } else {
      const idea = record.payload as Idea;
      if (idea.sync_id && await upsertRemoteIdea(idea)) pulled += 1;
    }
  }

  const [tasks, ideas] = await Promise.all([prepareTasks(), prepareIdeas()]);
  const records = [
    ...tasks.map((task) => ({ owner_id: auth.user.id, domain: "daily_tasks" as const, record_id: task.sync_id!, payload: task, updated_at: task.updated_at, deleted_at: task.deleted_at })),
    ...ideas.map((idea) => ({ owner_id: auth.user.id, domain: "ideas" as const, record_id: idea.sync_id!, payload: idea, updated_at: idea.updated_at, deleted_at: idea.deleted_at })),
  ];
  if (records.length) {
    const { error: pushError } = await supabase.from("rakit_records").upsert(records, { onConflict: "owner_id,domain,record_id" });
    if (pushError) throw pushError;
  }
  await syncMonitorSnapshot(auth.user.id);
  return { pushed: records.length, pulled };
}

let pendingSync: ReturnType<typeof setTimeout> | undefined;
export function scheduleRakitSync() {
  window.clearTimeout(pendingSync);
  pendingSync = window.setTimeout(() => { void syncRakitEditableData().catch(console.warn); }, 800);
}
