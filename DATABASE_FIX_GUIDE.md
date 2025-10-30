# Database Fix Guide

## Issue
The `cold_outreach_email_campaigns` table is missing the `name` column, causing campaign creation to fail with error:
```
Could not find the 'name' column of 'cold_outreach_email_campaigns' in the schema cache
```

## Solution

### Step 1: Run the Fix Script in Supabase

1. Go to your Supabase project: https://zgrfotgxxoceyqslmexw.supabase.co
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `db/FIX_CAMPAIGNS_TABLE.sql`
5. Click "Run" or press Cmd/Ctrl + Enter

### Step 2: Verify the Fix

After running the script, you should see output like:
```
Added name column to cold_outreach_email_campaigns
Added status column to cold_outreach_email_campaigns
```

### Step 3: Test Campaign Creation

1. Go to your app: `/campaigns/new`
2. Enter a campaign name
3. Create email templates
4. Click "Save & Select Leads"
5. Should work without errors!

## What the Fix Does

The script adds these columns to `cold_outreach_email_campaigns`:
- `name` (text, required) - Campaign name
- `status` (text) - Campaign status (draft, active, paused, completed, cancelled)
- `created_at` (timestamptz) - When campaign was created
- `updated_at` (timestamptz) - When campaign was last updated

It also creates indexes for better performance.

## Alternative: Manual Fix

If you prefer to run commands manually:

```sql
-- Add name column
ALTER TABLE cold_outreach_email_campaigns 
ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Untitled Campaign';

-- Add status column
ALTER TABLE cold_outreach_email_campaigns 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft' 
CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled'));

-- Add timestamps
ALTER TABLE cold_outreach_email_campaigns 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE cold_outreach_email_campaigns 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_campaigns_name 
ON cold_outreach_email_campaigns(name);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status 
ON cold_outreach_email_campaigns(status);
```

## Verification

To verify the fix worked, run this query:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'cold_outreach_email_campaigns'
ORDER BY ordinal_position;
```

You should see the `name` column in the results.

## After Fix

Once the database is fixed:
1. Campaign creation will work
2. You can name your campaigns
3. The workflow will proceed to lead selection
4. Everything else will work as expected

---

**File to run:** `db/FIX_CAMPAIGNS_TABLE.sql`
**Location:** Supabase SQL Editor
**Time:** ~5 seconds
