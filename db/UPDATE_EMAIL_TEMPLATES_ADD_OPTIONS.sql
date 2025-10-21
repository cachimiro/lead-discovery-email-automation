-- Add new fields to cold_outreach_email_templates for flexible email sending
-- Run this in Supabase SQL Editor

-- Add sender information fields
ALTER TABLE cold_outreach_email_templates 
ADD COLUMN IF NOT EXISTS sender_name text DEFAULT 'Mark Hayward',
ADD COLUMN IF NOT EXISTS sender_email text DEFAULT 'mark@swaypr.com';

-- Add option to include email thread/trace in follow-ups
ALTER TABLE cold_outreach_email_templates 
ADD COLUMN IF NOT EXISTS include_thread boolean DEFAULT true;

-- Add option to enable/disable each template
ALTER TABLE cold_outreach_email_templates 
ADD COLUMN IF NOT EXISTS is_enabled boolean DEFAULT true;

-- Add notes/description for each template
ALTER TABLE cold_outreach_email_templates 
ADD COLUMN IF NOT EXISTS description text;

-- Comments
COMMENT ON COLUMN cold_outreach_email_templates.sender_name IS 'Name of the person sending the email (e.g., Mark Hayward)';
COMMENT ON COLUMN cold_outreach_email_templates.sender_email IS 'Email address of the sender';
COMMENT ON COLUMN cold_outreach_email_templates.include_thread IS 'Whether to include previous email thread in follow-ups (Email 2 and 3)';
COMMENT ON COLUMN cold_outreach_email_templates.is_enabled IS 'Whether this template is active and should be sent';
COMMENT ON COLUMN cold_outreach_email_templates.description IS 'Description of what this email does (e.g., Initial outreach, First follow-up, Final follow-up)';

-- Success message
SELECT 'Email templates table updated successfully!' as status;
