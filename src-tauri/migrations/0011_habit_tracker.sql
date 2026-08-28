CREATE TABLE IF NOT EXISTS habit_trackers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  notes TEXT,
  category TEXT NOT NULL DEFAULT 'Pribadi',
  color TEXT NOT NULL DEFAULT '#60a5fa',
  tracking_type TEXT NOT NULL DEFAULT 'checklist',
  target_monthly INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS habit_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tracker_id INTEGER NOT NULL REFERENCES habit_trackers(id) ON DELETE CASCADE,
  entry_date TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  value_number REAL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tracker_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_habit_entries_tracker_date
  ON habit_entries(tracker_id, entry_date);

CREATE INDEX IF NOT EXISTS idx_habit_trackers_deleted
  ON habit_trackers(deleted_at, archived);
