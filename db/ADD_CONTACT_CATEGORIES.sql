-- Add categories column to contacts table
ALTER TABLE cold_outreach_contacts 
ADD COLUMN IF NOT EXISTS categories text[];

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_contacts_categories 
ON cold_outreach_contacts USING GIN (categories);

-- Add comment
COMMENT ON COLUMN cold_outreach_contacts.categories IS 'Decision maker categories: ceo, marketing, sales, hr, finance, operations, etc.';
