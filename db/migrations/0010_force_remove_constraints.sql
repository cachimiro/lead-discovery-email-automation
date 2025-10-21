-- FORCE REMOVE all foreign key constraints
-- Run this if you're still getting foreign key errors

-- First, let's see what constraints exist
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Loop through all foreign key constraints and drop them
    FOR r IN (
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name IN (
            'leads', 'contacts', 'email_templates', 
            'journalist_leads', 'email_campaigns', 'user_profiles'
        )
    ) LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I CASCADE', 
                      r.table_name, r.constraint_name);
        RAISE NOTICE 'Dropped constraint % from table %', r.constraint_name, r.table_name;
    END LOOP;
END $$;

-- Explicitly drop known constraints by name
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_user_id_fkey CASCADE;
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_user_id_fkey CASCADE;
ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS email_templates_user_id_fkey CASCADE;
ALTER TABLE journalist_leads DROP CONSTRAINT IF EXISTS journalist_leads_user_id_fkey CASCADE;
ALTER TABLE email_campaigns DROP CONSTRAINT IF EXISTS email_campaigns_user_id_fkey CASCADE;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey CASCADE;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_pkey CASCADE;

-- Also drop any constraints that might reference journalist_leads or contacts
ALTER TABLE email_campaigns DROP CONSTRAINT IF EXISTS email_campaigns_journalist_lead_id_fkey CASCADE;
ALTER TABLE email_campaigns DROP CONSTRAINT IF EXISTS email_campaigns_contact_id_fkey CASCADE;

-- Recreate user_profiles primary key without foreign key
ALTER TABLE user_profiles ADD PRIMARY KEY (id);

-- Recreate email_campaigns foreign keys to journalist_leads and contacts (not to auth.users)
ALTER TABLE email_campaigns 
  ADD CONSTRAINT email_campaigns_journalist_lead_id_fkey 
  FOREIGN KEY (journalist_lead_id) 
  REFERENCES journalist_leads(id) 
  ON DELETE CASCADE;

ALTER TABLE email_campaigns 
  ADD CONSTRAINT email_campaigns_contact_id_fkey 
  FOREIGN KEY (contact_id) 
  REFERENCES contacts(id) 
  ON DELETE CASCADE;

-- Verify no foreign keys to auth.users remain
DO $$ 
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND ccu.table_name = 'users'
    AND ccu.table_schema = 'auth';
    
    IF constraint_count > 0 THEN
        RAISE EXCEPTION 'Still have % foreign keys to auth.users!', constraint_count;
    ELSE
        RAISE NOTICE 'Success! No foreign keys to auth.users found.';
    END IF;
END $$;

-- Update RLS policies to be permissive
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE journalist_leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON leads;
DROP POLICY IF EXISTS "Allow all for leads" ON leads;

DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON contacts;
DROP POLICY IF EXISTS "Allow all for contacts" ON contacts;

DROP POLICY IF EXISTS "Users can view their own email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can insert their own email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can update their own email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can delete their own email templates" ON email_templates;
DROP POLICY IF EXISTS "Allow all for email_templates" ON email_templates;

DROP POLICY IF EXISTS "Users can view their own journalist leads" ON journalist_leads;
DROP POLICY IF EXISTS "Users can insert their own journalist leads" ON journalist_leads;
DROP POLICY IF EXISTS "Users can update their own journalist leads" ON journalist_leads;
DROP POLICY IF EXISTS "Users can delete their own journalist leads" ON journalist_leads;
DROP POLICY IF EXISTS "Allow all for journalist_leads" ON journalist_leads;

DROP POLICY IF EXISTS "Users can view their own email campaigns" ON email_campaigns;
DROP POLICY IF EXISTS "Users can insert their own email campaigns" ON email_campaigns;
DROP POLICY IF EXISTS "Users can update their own email campaigns" ON email_campaigns;
DROP POLICY IF EXISTS "Allow all for email_campaigns" ON email_campaigns;

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow all for user_profiles" ON user_profiles;

-- Re-enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalist_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create simple permissive policies
CREATE POLICY "allow_all" ON leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON email_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON journalist_leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON email_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON user_profiles FOR ALL USING (true) WITH CHECK (true);

-- Final verification
SELECT 
    'SUCCESS: All foreign keys to auth.users have been removed!' as status,
    COUNT(*) as remaining_fk_to_auth_users
FROM information_schema.table_constraints AS tc 
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND ccu.table_name = 'users'
AND ccu.table_schema = 'auth';
