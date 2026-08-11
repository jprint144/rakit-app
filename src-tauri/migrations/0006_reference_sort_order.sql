ALTER TABLE reference_items ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

UPDATE reference_items
SET sort_order = id
WHERE sort_order = 0;
