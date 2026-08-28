ALTER TABLE daily_tasks ADD COLUMN sync_id TEXT;
ALTER TABLE daily_tasks ADD COLUMN deleted_at TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_tasks_sync_id ON daily_tasks(sync_id);

ALTER TABLE ideas ADD COLUMN sync_id TEXT;
ALTER TABLE ideas ADD COLUMN deleted_at TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ideas_sync_id ON ideas(sync_id);
