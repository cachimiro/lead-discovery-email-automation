-- Add name column to cold_outreach_email_campaigns table
-- This allows campaigns to have a descriptive name

ALTER TABLE cold_outreach_email_campaigns 
ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Untitled Campaign';

-- Add index for searching campaigns by name
CREATE INDEX IF NOT EXISTS idx_email_campaigns_name ON cold_outreach_email_campaigns(name);

-- Update existing campaigns to have a default name
UPDATE cold_outreach_email_campaigns 
SET name = 'Campaign ' || id::text 
WHERE name = 'Untitled Campaign';
