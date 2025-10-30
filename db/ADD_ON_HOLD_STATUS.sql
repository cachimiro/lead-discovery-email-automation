-- Add 'on_hold' status to email queue
-- This status is used when a contact doesn't have a matching industry yet

-- First, drop the old constraint
ALTER TABLE cold_outreach_email_queue 
DROP CONSTRAINT IF EXISTS cold_outreach_email_queue_status_check;

-- Add the new constraint with 'on_hold' included
ALTER TABLE cold_outreach_email_queue 
ADD CONSTRAINT cold_outreach_email_queue_status_check 
CHECK (status IN ('pending', 'on_hold', 'sending', 'sent', 'failed', 'cancelled', 'response_received'));
