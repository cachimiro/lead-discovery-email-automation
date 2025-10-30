-- Add contact_id column to email queue table
-- This links each queued email to the contact it's being sent to

ALTER TABLE cold_outreach_email_queue 
ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES cold_outreach_contacts(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_email_queue_contact_id ON cold_outreach_email_queue(contact_id);

-- Add journalist_id column to track which journalist was matched
ALTER TABLE cold_outreach_email_queue 
ADD COLUMN IF NOT EXISTS journalist_id uuid REFERENCES cold_outreach_journalist_leads(id) ON DELETE SET NULL;

-- Add index for journalist queries
CREATE INDEX IF NOT EXISTS idx_email_queue_journalist_id ON cold_outreach_email_queue(journalist_id);

-- Remove the old unique constraint that doesn't make sense with multiple contacts
ALTER TABLE cold_outreach_email_queue 
DROP CONSTRAINT IF EXISTS unique_campaign_followup;

-- Add a better unique constraint: one email per contact per follow-up number per campaign
ALTER TABLE cold_outreach_email_queue 
ADD CONSTRAINT IF NOT EXISTS unique_contact_campaign_followup 
UNIQUE (campaign_id, contact_id, follow_up_number);
