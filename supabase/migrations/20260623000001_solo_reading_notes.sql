-- Allow reading notes without a swap (solo/self reading notes)
ALTER TABLE reading_notes ALTER COLUMN swap_request_id DROP NOT NULL;
