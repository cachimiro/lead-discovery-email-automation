-- Create campaigns metadata table to track campaign information
CREATE TABLE IF NOT EXISTS cold_outreach_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  total_contacts int DEFAULT 0,
  emails_sent int DEFAULT 0,
  emails_opened int DEFAULT 0,
  emails_clicked int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Create index
CREATE INDEX IF NOT EXISTS cold_outreach_campaigns_user_id_idx ON cold_outreach_campaigns(user_id);
CREATE INDEX IF NOT EXISTS cold_outreach_campaigns_status_idx ON cold_outreach_campaigns(status);

-- Enable RLS
ALTER TABLE cold_outreach_campaigns ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage their own campaigns"
  ON cold_outreach_campaigns
  FOR ALL
  USING (user_id = current_setting('request.jwt.claim.sub', true)::uuid);

-- Add campaign_id to email_campaigns table to link individual emails to campaigns
ALTER TABLE cold_outreach_email_campaigns 
ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES cold_outreach_campaigns(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS cold_outreach_email_campaigns_campaign_id_idx 
ON cold_outreach_email_campaigns(campaign_id);

COMMENT ON TABLE cold_outreach_campaigns IS 'Campaign metadata and tracking';
COMMENT ON COLUMN cold_outreach_email_campaigns.campaign_id IS 'Links individual email sends to a campaign';
