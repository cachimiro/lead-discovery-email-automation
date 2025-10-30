-- Add industry and validation fields to contacts table
ALTER TABLE cold_outreach_contacts 
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS email_status text,
ADD COLUMN IF NOT EXISTS is_valid boolean DEFAULT true;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_contacts_industry 
ON cold_outreach_contacts (industry);

CREATE INDEX IF NOT EXISTS idx_contacts_email_status 
ON cold_outreach_contacts (email_status);

-- Add comments
COMMENT ON COLUMN cold_outreach_contacts.industry IS 'Industry/sector of the contact company';
COMMENT ON COLUMN cold_outreach_contacts.email_status IS 'Email validation status: valid, invalid, risky, unknown';
COMMENT ON COLUMN cold_outreach_contacts.is_valid IS 'Whether the email is valid (derived from email_status)';
