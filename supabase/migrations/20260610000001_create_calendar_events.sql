CREATE TABLE calendar_events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  date       DATE        NOT NULL,
  time       TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_calendar_events_user_id_date ON calendar_events(user_id, date);
