-- Add pool_ids column to cold_outreach_campaigns table
-- This stores which lead pools are selected for a campaign

ALTER TABLE cold_outreach_campaigns 
ADD COLUMN IF NOT EXISTS pool_ids uuid[] DEFAULT NULL;

COMMENT ON COLUMN cold_outreach_campaigns.pool_ids IS 'Array of lead pool IDs selected for this campaign. NULL means all contacts.';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS cold_outreach_campaigns_pool_ids_idx 
ON cold_outreach_campaigns USING GIN (pool_ids);
