CREATE TABLE IF NOT EXISTS daily_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  notes TEXT,
  task_date TEXT NOT NULL,
  task_time TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  category TEXT NOT NULL DEFAULT 'Pribadi',
  completed INTEGER NOT NULL DEFAULT 0,
  reminder_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_date_completed
  ON daily_tasks(task_date, completed);
