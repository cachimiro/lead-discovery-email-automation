# Database Setup Guide

## Required Tables in Supabase

This application requires the following tables in your Supabase database. All tables use Row Level Security (RLS) to ensure users can only access their own data.

### Tables Overview

1. **leads** - Stores discovered email leads
2. **user_profiles** - User profile information
3. **contacts** - User's personal contact database
4. **email_templates** - Email templates for outreach
5. **journalist_leads** - Journalist opportunities/leads
6. **email_campaigns** - Email campaign tracking

### Setup Instructions

#### Option 1: Run All Migrations (Recommended)

Execute the migration file in Supabase SQL Editor:

```sql
-- Run this file in Supabase SQL Editor
-- File: db/migrations/0007_verify_all_tables.sql
```

This migration is **safe to run multiple times** - it uses `create table if not exists` and checks for existing policies before creating them.

#### Option 2: Run Individual Migrations

Execute migrations in order:

1. `0001_init.sql` - Creates leads table
2. `0004_auth_tables.sql` - Creates user_profiles, contacts, email_templates
3. `0005_auth_policies.sql` - Sets up RLS policies
4. `0006_journalist_leads.sql` - Creates journalist_leads and email_campaigns

### Table Schemas

#### 1. leads
```sql
- id (uuid, primary key)
- company_domain (text, not null)
- company_name (text)
- full_name (text)
- email (text, not null)
- title (text)
- seniority (text)
- source (text, default 'anymailfinder')
- verified_at (timestamptz)
- neverbounce_result (text)
- stripe_session_id (text)
- user_id (uuid, references auth.users)
- created_at (timestamptz)
```

#### 2. user_profiles
```sql
- id (uuid, primary key, references auth.users)
- email (text, not null)
- full_name (text)
- avatar_url (text)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### 3. contacts
```sql
- id (uuid, primary key)
- user_id (uuid, references auth.users, not null)
- email (text, not null)
- first_name (text)
- last_name (text)
- company (text)
- title (text)
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)
- UNIQUE(user_id, email)
```

#### 4. email_templates
```sql
- id (uuid, primary key)
- user_id (uuid, references auth.users, not null)
- template_number (int, 1-3)
- subject (text, not null)
- body (text, not null)
- created_at (timestamptz)
- updated_at (timestamptz)
- UNIQUE(user_id, template_number)
```

#### 5. journalist_leads
```sql
- id (uuid, primary key)
- user_id (uuid, references auth.users, not null)
- journalist_name (text, not null)
- publication (text, not null)
- subject (text, not null)
- industry (text, not null)
- deadline (date, not null)
- linkedin_category (text)
- notes (text)
- is_active (boolean, default true)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### 6. email_campaigns
```sql
- id (uuid, primary key)
- user_id (uuid, references auth.users, not null)
- journalist_lead_id (uuid, references journalist_leads, not null)
- contact_id (uuid, references contacts, not null)
- template_number (int, 1-3)
- subject (text, not null)
- body (text, not null)
- status (text, 'draft'|'sent'|'failed')
- sent_at (timestamptz)
- error_message (text)
- created_at (timestamptz)
```

### Verification

After running the migrations, verify tables exist:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'leads', 
  'user_profiles', 
  'contacts', 
  'email_templates', 
  'journalist_leads', 
  'email_campaigns'
);
```

### RLS Policies

All tables have Row Level Security enabled with policies that:
- Allow users to SELECT their own data
- Allow users to INSERT their own data
- Allow users to UPDATE their own data
- Allow users to DELETE their own data (where applicable)

Policies use `auth.uid()` to match against `user_id` or `id` columns.

### Important Notes

⚠️ **Do NOT delete existing tables** - This database may contain other projects. The migrations use `create table if not exists` to safely add tables without affecting existing data.

✅ **Safe to re-run** - All migrations are idempotent and can be run multiple times without errors.

### Testing Database Connection

After setup, test the connection by:
1. Log in to the application
2. Try adding a contact at `/contacts`
3. Try adding a journalist lead at `/journalist-leads`
4. Check Supabase dashboard to verify data appears

### Troubleshooting

**Issue: "relation does not exist"**
- Run the migration file `0007_verify_all_tables.sql`

**Issue: "permission denied"**
- Check RLS policies are enabled
- Verify you're logged in with OAuth

**Issue: "duplicate key value violates unique constraint"**
- This is expected if trying to add duplicate data
- Check unique constraints in table schemas above
