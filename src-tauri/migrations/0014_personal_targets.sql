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
);

CREATE INDEX IF NOT EXISTS idx_personal_targets_status
ON personal_targets(deleted_at, status, type);
