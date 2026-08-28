CREATE TABLE IF NOT EXISTS job_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'LinkedIn',
  job_url TEXT,
  applied_at TEXT NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Sudah apply',
  priority TEXT NOT NULL DEFAULT 'Normal',
  follow_up_at TEXT,
  contact_name TEXT,
  contact_info TEXT,
  salary_range TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_job_applications_status
  ON job_applications(status, updated_at);

CREATE INDEX IF NOT EXISTS idx_job_applications_follow_up
  ON job_applications(follow_up_at, status);
