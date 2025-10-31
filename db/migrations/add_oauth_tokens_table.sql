-- Create table for storing OAuth tokens
CREATE TABLE IF NOT EXISTS cold_outreach_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES cold_outreach_user_profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON cold_outreach_oauth_tokens(user_id);

-- Add RLS policies
ALTER TABLE cold_outreach_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only read their own tokens
CREATE POLICY "Users can read own tokens"
  ON cold_outreach_oauth_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all tokens
CREATE POLICY "Service role can manage tokens"
  ON cold_outreach_oauth_tokens
  FOR ALL
  USING (true);

COMMENT ON TABLE cold_outreach_oauth_tokens IS 'Stores OAuth access and refresh tokens for sending emails from user accounts';
