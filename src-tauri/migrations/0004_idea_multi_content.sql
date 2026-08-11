ALTER TABLE ideas ADD COLUMN text_content TEXT;
ALTER TABLE ideas ADD COLUMN document_path TEXT;
ALTER TABLE ideas ADD COLUMN image_path TEXT;
ALTER TABLE ideas ADD COLUMN link_url TEXT;

UPDATE ideas
SET text_content = content
WHERE content_type = 'text' AND text_content IS NULL;

UPDATE ideas
SET document_path = content
WHERE content_type = 'document' AND document_path IS NULL;

UPDATE ideas
SET image_path = content
WHERE content_type = 'image' AND image_path IS NULL;

UPDATE ideas
SET link_url = content
WHERE content_type = 'link' AND link_url IS NULL;
