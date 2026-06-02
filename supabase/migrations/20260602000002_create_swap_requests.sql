CREATE TABLE swap_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id    TEXT        NOT NULL REFERENCES users(id),
  receiver_id     TEXT        REFERENCES users(id),
  offered_book_id UUID        NOT NULL REFERENCES user_books(id),
  wanted_book_id  UUID        REFERENCES user_books(id),
  is_public       BOOLEAN     NOT NULL DEFAULT false,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'expired')),
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;
