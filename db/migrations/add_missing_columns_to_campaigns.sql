-- Add missing columns to cold_outreach_campaigns table

-- Add started_at if it doesn't exist
ALTER TABLE cold_outreach_campaigns 
ADD COLUMN IF NOT EXISTS started_at timestamptz;

-- Add completed_at if it doesn't exist
ALTER TABLE cold_outreach_campaigns 
ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Add pool_ids if it doesn't exist (from previous migration)
ALTER TABLE cold_outreach_campaigns 
ADD COLUMN IF NOT EXISTS pool_ids uuid[];

-- Create index for pool_ids
CREATE INDEX IF NOT EXISTS cold_outreach_campaigns_pool_ids_idx 
ON cold_outreach_campaigns USING GIN (pool_ids);

COMMENT ON COLUMN cold_outreach_campaigns.started_at IS 'When the campaign was started (status changed to active)';
COMMENT ON COLUMN cold_outreach_campaigns.completed_at IS 'When the campaign was completed';
COMMENT ON COLUMN cold_outreach_campaigns.pool_ids IS 'Array of lead pool IDs selected for this campaign';
