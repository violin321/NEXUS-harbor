CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS service_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'zap',
  group_name TEXT NOT NULL DEFAULT 'default',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  check_path TEXT NOT NULL DEFAULT '/',
  expected_status INTEGER NOT NULL DEFAULT 200,
  public_url TEXT,
  link_label TEXT NOT NULL DEFAULT '访问',
  check_level INTEGER NOT NULL DEFAULT 1,
  api_config JSONB,
  script_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS check_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES service_checks(id) ON DELETE CASCADE,
  latency_ms INTEGER,
  status_code INTEGER NOT NULL DEFAULT 0,
  ok BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_check_results_service_checked_at
  ON check_results(service_id, checked_at DESC);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  github_username TEXT,
  preferences JSONB NOT NULL DEFAULT '{"theme":"system"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (key, value)
VALUES ('system_status_public', 'false')
ON CONFLICT (key) DO NOTHING;
