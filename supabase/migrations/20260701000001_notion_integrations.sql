CREATE TABLE notion_integrations (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token   TEXT        NOT NULL,
  workspace_id   TEXT        NOT NULL,
  workspace_name TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE notion_integrations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notion_integrations_user_id ON notion_integrations(user_id);
