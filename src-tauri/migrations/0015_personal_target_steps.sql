CREATE TABLE IF NOT EXISTS personal_target_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_id INTEGER NOT NULL REFERENCES personal_targets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_personal_target_steps_target
ON personal_target_steps(target_id, sort_order, id);

WITH RECURSIVE step_numbers(target_id, step_number, target_value, current_value) AS (
  SELECT id, 1, MAX(1, target_value), MAX(0, current_value)
  FROM personal_targets
  WHERE type = 'achievement' AND deleted_at IS NULL
  UNION ALL
  SELECT target_id, step_number + 1, target_value, current_value
  FROM step_numbers
  WHERE step_number < target_value
)
INSERT INTO personal_target_steps (target_id, title, completed, sort_order)
SELECT target_id, 'Langkah ' || step_number, CASE WHEN step_number <= current_value THEN 1 ELSE 0 END, step_number
FROM step_numbers;
