ALTER TABLE swap_requests ADD COLUMN completed_by TEXT REFERENCES users(id) ON DELETE SET NULL;
