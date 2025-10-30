-- Fix cold_outreach_email_campaigns table structure
-- Run this in Supabase SQL Editor

-- First, check if the table exists and what columns it has
DO $$
BEGIN
    -- Add name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cold_outreach_email_campaigns' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE cold_outreach_email_campaigns 
        ADD COLUMN name text NOT NULL DEFAULT 'Untitled Campaign';
        
        RAISE NOTICE 'Added name column to cold_outreach_email_campaigns';
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cold_outreach_email_campaigns' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE cold_outreach_email_campaigns 
        ADD COLUMN status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled'));
        
        RAISE NOTICE 'Added status column to cold_outreach_email_campaigns';
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cold_outreach_email_campaigns' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE cold_outreach_email_campaigns 
        ADD COLUMN created_at timestamptz DEFAULT now();
        
        RAISE NOTICE 'Added created_at column to cold_outreach_email_campaigns';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cold_outreach_email_campaigns' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE cold_outreach_email_campaigns 
        ADD COLUMN updated_at timestamptz DEFAULT now();
        
        RAISE NOTICE 'Added updated_at column to cold_outreach_email_campaigns';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_campaigns_name ON cold_outreach_email_campaigns(name);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON cold_outreach_email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON cold_outreach_email_campaigns(created_at);

-- Update existing campaigns to have meaningful names
UPDATE cold_outreach_email_campaigns 
SET name = 'Campaign ' || substring(id::text, 1, 8)
WHERE name = 'Untitled Campaign' OR name IS NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'cold_outreach_email_campaigns'
ORDER BY ordinal_position;
