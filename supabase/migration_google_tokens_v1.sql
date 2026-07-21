-- Bảng lưu Google OAuth tokens cho từng user
-- Chỉ service_role có quyền đọc/ghi (tokens nhạy cảm, không expose cho client)

CREATE TABLE IF NOT EXISTS google_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  sheet_id TEXT,
  sheet_name TEXT NOT NULL DEFAULT 'ProtLife_Data_Export',
  sheet_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- Chỉ service_role mới được truy cập
CREATE POLICY "Service role full access" ON google_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);
