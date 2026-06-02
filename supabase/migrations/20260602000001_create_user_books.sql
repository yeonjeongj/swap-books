CREATE TABLE user_books (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  isbn       TEXT,
  title      TEXT        NOT NULL,
  author     TEXT        NOT NULL,
  publisher  TEXT,
  cover_image TEXT,
  quote      TEXT,
  reason     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;
