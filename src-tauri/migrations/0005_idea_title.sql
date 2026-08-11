ALTER TABLE ideas ADD COLUMN title TEXT NOT NULL DEFAULT '';
UPDATE ideas SET title = COALESCE(NULLIF(trim(text_content), ''), NULLIF(document_path, ''), NULLIF(image_path, ''), NULLIF(link_url, ''), 'Idea tanpa judul') WHERE title = '';
