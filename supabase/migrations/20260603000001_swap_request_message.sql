ALTER TABLE user_books DROP COLUMN IF EXISTS quote;
ALTER TABLE user_books DROP COLUMN IF EXISTS reason;

ALTER TABLE swap_requests ADD COLUMN IF NOT EXISTS requester_message TEXT;
