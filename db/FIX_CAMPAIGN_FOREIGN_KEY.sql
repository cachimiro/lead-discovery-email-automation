-- Fix the foreign key constraint to point to the correct campaigns table
-- The table is 'cold_outreach_campaigns' not 'cold_outreach_email_campaigns'

-- Drop the old foreign key constraint
ALTER TABLE cold_outreach_email_queue 
DROP CONSTRAINT IF EXISTS cold_outreach_email_queue_campaign_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE cold_outreach_email_queue 
ADD CONSTRAINT cold_outreach_email_queue_campaign_id_fkey 
FOREIGN KEY (campaign_id) 
REFERENCES cold_outreach_campaigns(id) 
ON DELETE CASCADE;
