-- Make quote optional (page alone is sufficient)
ALTER TABLE reading_notes ALTER COLUMN quote DROP NOT NULL;

-- Add image attachment support
ALTER TABLE reading_notes ADD COLUMN image_url TEXT;

-- Add threading support for comments
ALTER TABLE reading_note_comments ADD COLUMN parent_id UUID REFERENCES reading_note_comments(id) ON DELETE CASCADE;
CREATE INDEX idx_reading_note_comments_parent_id ON reading_note_comments(parent_id);
