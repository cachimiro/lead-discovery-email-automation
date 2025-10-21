# Troubleshooting Foreign Key Error - Step by Step

## Current Error
```
insert or update on table "journalist_leads" violates foreign key constraint "journalist_leads_user_id_fkey"
```

## Diagnosis Steps

### Step 1: Check if Constraints Still Exist

Run this in Supabase SQL Editor:
```sql
SELECT
  tc.table_name, 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS references_table
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name = 'journalist_leads';
```

**Expected Result:** 2 rows (foreign keys to `journalist_leads` and `contacts` tables only)
**Problem:** If you see a foreign key to `auth.users`, the migration didn't work

### Step 2: Force Remove Constraints

If constraints still exist, run this migration:
```
File: db/migrations/0010_force_remove_constraints.sql
```

This migration:
- ✅ Loops through ALL foreign keys and drops them
- ✅ Explicitly drops known constraints
- ✅ Recreates only the necessary foreign keys (not to auth.users)
- ✅ Verifies the fix worked

### Step 3: Check What User ID is Being Used

Add logging to see what user_id is being sent. 

**Option A: Check in Supabase**
```sql
-- See what user_ids exist in user_profiles
SELECT id, email, full_name FROM user_profiles;

-- Try to insert a test record manually
INSERT INTO journalist_leads (
  user_id,
  journalist_name,
  publication,
  subject,
  industry,
  deadline
) VALUES (
  '<paste-user-id-from-above>',
  'Test Journalist',
  'Test Publication',
  'Test Subject',
  'Technology',
  '2025-12-31'
);
```

If manual insert works, the issue is with the user_id from the session.

**Option B: Check Session User ID**

Temporarily add logging to the API route:

```typescript
// In app/api/journalist-leads/route.ts
console.log('Session user ID:', session.user.id);
console.log('Session user:', JSON.stringify(session.user));
```

Check server logs to see what ID is being used.

### Step 4: Verify User Profile Exists

The user_id must exist in `user_profiles` table:

```sql
-- Check if your user profile exists
SELECT * FROM user_profiles WHERE email = 'your-email@example.com';
```

If no profile exists:
1. Log out
2. Log in again
3. Check if profile is created

### Step 5: Check Auth Callback

Verify the signIn callback is creating user profiles:

```typescript
// In lib/auth-config.ts - signIn callback should create user_profiles
const userId = generateUuidFromOAuthId(user.id);
await supabase.from("user_profiles").insert({
  id: userId,
  email: user.email,
  full_name: user.name,
  avatar_url: user.image,
});
```

## Solutions

### Solution 1: Run Force Remove Migration

**File:** `db/migrations/0010_force_remove_constraints.sql`

This is the most aggressive fix:
1. Drops ALL foreign keys
2. Recreates only necessary ones
3. Verifies the fix

**Steps:**
1. Open Supabase SQL Editor
2. Copy entire contents of `0010_force_remove_constraints.sql`
3. Paste and click Run
4. Check output - should say "SUCCESS"

### Solution 2: Manual Constraint Removal

If migration doesn't work, manually drop the constraint:

```sql
-- Drop the problematic constraint
ALTER TABLE journalist_leads 
DROP CONSTRAINT IF EXISTS journalist_leads_user_id_fkey CASCADE;

-- Verify it's gone
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'journalist_leads' 
AND constraint_type = 'FOREIGN KEY'
AND constraint_name LIKE '%user_id%';
```

Should return 0 rows.

### Solution 3: Disable RLS Temporarily

If still not working, temporarily disable RLS to test:

```sql
-- Disable RLS on journalist_leads
ALTER TABLE journalist_leads DISABLE ROW LEVEL SECURITY;

-- Try adding a lead now
-- If it works, the issue is with RLS policies, not foreign keys
```

If this works, the issue is RLS policies, not foreign keys.

### Solution 4: Check Supabase Admin Client

The API uses `supabaseAdmin()` which bypasses RLS. Verify it's configured correctly:

```typescript
// In lib/supabase.ts
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;  // Must be service role key
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}
```

Check `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Must be service_role key, not anon key
```

## Verification Checklist

After applying fixes:

- [ ] Run constraint check query - should show 0 foreign keys to auth.users
- [ ] User profile exists in user_profiles table
- [ ] Can manually insert into journalist_leads via SQL
- [ ] RLS is enabled but policies are permissive
- [ ] Service role key is correct in .env.local
- [ ] Session user.id matches user_profiles.id

## Common Mistakes

### Mistake 1: Using Anon Key Instead of Service Role Key
```bash
# Wrong
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpncmZvdGd4eG9jZXlxc2xtZXh3Iiwicm9sZSI6ImFub24i...

# Right (has "service_role" in the payload)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpncmZvdGd4eG9jZXlxc2xtZXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSI...
```

### Mistake 2: Migration Not Actually Run
- Copy the ENTIRE file contents
- Don't just copy part of it
- Click "Run" and wait for completion
- Check for error messages

### Mistake 3: Wrong Table Name
- Table is `journalist_leads` (plural)
- Not `journalist_lead` (singular)

### Mistake 4: User Profile Not Created
- Log out and log in again
- Check server logs for signIn callback errors
- Verify user_profiles table has your record

## Debug Queries

### Check All Foreign Keys
```sql
SELECT
  tc.table_name, 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

### Check RLS Status
```sql
SELECT 
  tablename, 
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN ('journalist_leads', 'contacts', 'email_templates', 'user_profiles')
ORDER BY tablename;
```

### Check User Profiles
```sql
SELECT 
  id,
  email,
  full_name,
  created_at
FROM user_profiles
ORDER BY created_at DESC;
```

### Test Insert Manually
```sql
-- Get a user_id from user_profiles
SELECT id FROM user_profiles LIMIT 1;

-- Try to insert with that user_id
INSERT INTO journalist_leads (
  user_id,
  journalist_name,
  publication,
  subject,
  industry,
  deadline
) VALUES (
  '<paste-id-here>',
  'Test',
  'Test',
  'Test',
  'Technology',
  '2025-12-31'
) RETURNING *;
```

If this works, the issue is with the session user_id.

## Still Not Working?

If you've tried everything:

1. **Export your data** (if any exists)
2. **Drop and recreate the table:**
```sql
DROP TABLE IF EXISTS journalist_leads CASCADE;

CREATE TABLE journalist_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,  -- NO FOREIGN KEY
  journalist_name text not null,
  publication text not null,
  subject text not null,
  industry text not null,
  deadline date not null,
  linkedin_category text,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
ALTER TABLE journalist_leads ENABLE ROW LEVEL SECURITY;

-- Permissive policy
CREATE POLICY "allow_all" ON journalist_leads 
FOR ALL USING (true) WITH CHECK (true);
```

3. **Try adding a lead again**

## Contact for Help

If still stuck, provide:
1. Output of constraint check query
2. Output of user_profiles query
3. Server logs showing the error
4. Screenshot of Supabase error message

---

**Last Updated:** 2025-10-19
**Status:** Troubleshooting Guide
