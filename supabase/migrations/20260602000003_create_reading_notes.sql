CREATE TABLE reading_notes (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id        TEXT        NOT NULL REFERENCES users(id),
  swap_request_id  UUID        NOT NULL REFERENCES swap_requests(id) ON DELETE CASCADE,
  book_id          UUID        NOT NULL REFERENCES user_books(id),
  page             INTEGER     NOT NULL,
  quote            TEXT        NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reading_notes ENABLE ROW LEVEL SECURITY;

CREATE TABLE reading_note_comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id    UUID        NOT NULL REFERENCES reading_notes(id) ON DELETE CASCADE,
  author_id  TEXT        NOT NULL REFERENCES users(id),
  text       TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reading_note_comments ENABLE ROW LEVEL SECURITY;
