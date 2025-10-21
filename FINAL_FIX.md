# 🔴 FINAL FIX - Foreign Key Error

## The Problem

You're getting this error:
```
insert or update on table "journalist_leads" violates foreign key constraint "journalist_leads_user_id_fkey"
```

**This means:** The previous migrations didn't fully remove the foreign key constraints.

## ✅ THE SOLUTION - One-Click Fix

### Run This Single File

**File:** `db/ONE_CLICK_FIX.sql`

This file will:
1. ✅ Drop ALL existing foreign key constraints
2. ✅ Recreate tables WITHOUT foreign keys to auth.users
3. ✅ Set up proper indexes
4. ✅ Enable RLS with permissive policies
5. ✅ Verify the fix worked

### Steps:

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy** the ENTIRE contents of `db/ONE_CLICK_FIX.sql`
3. **Paste** into SQL Editor
4. **Click Run**
5. **Wait** for completion (should take 5-10 seconds)
6. **Check** output - should say "SUCCESS! Tables recreated"

⚠️ **WARNING:** This will drop and recreate the tables. Any existing data in these tables will be lost:
- user_profiles
- contacts
- email_templates
- journalist_leads
- email_campaigns

The `leads` table (for discovered emails) is NOT affected.

## After Running the Fix

### 1. Log Out and Log In Again
This will recreate your user profile with the correct UUID.

### 2. Test Adding a Journalist Lead
1. Go to `/journalist-leads`
2. Click "Add New Lead"
3. Fill in:
   - Journalist Name: Test Journalist
   - Publication: Test Publication
   - Subject: Test Subject
   - Industry: Technology
   - Deadline: Tomorrow's date
4. Click Save
5. ✅ Should work without errors!

### 3. Verify in Supabase
```sql
-- Check your user profile exists
SELECT * FROM user_profiles;

-- Check the journalist lead was created
SELECT * FROM journalist_leads;

-- Verify no foreign keys to auth.users
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY'
AND table_schema = 'public'
AND constraint_name LIKE '%user_id%';
```

Should show 0 rows for the last query.

## Why This Happens

The issue is that:
1. Your app generates custom UUIDs from OAuth IDs
2. These UUIDs don't exist in Supabase's `auth.users` table
3. Foreign key constraints require the UUID to exist in `auth.users`
4. Previous migrations tried to drop constraints but they persisted

## What This Fix Does Differently

Instead of trying to drop constraints, it:
1. **Drops the entire tables** (clean slate)
2. **Recreates them** without any foreign keys to auth.users
3. **Only adds foreign keys** between your own tables (email_campaigns → journalist_leads, contacts)
4. **Verifies** the fix worked

## Alternative: Manual Fix

If you don't want to drop tables, try this:

```sql
-- Just drop the specific constraint
ALTER TABLE journalist_leads 
DROP CONSTRAINT journalist_leads_user_id_fkey CASCADE;

-- Verify it's gone
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'journalist_leads' 
AND constraint_name = 'journalist_leads_user_id_fkey';
```

Should return 0 rows.

## Still Not Working?

### Check 1: Is the constraint really gone?
```sql
\d journalist_leads
```

Look for "Foreign-key constraints" section. Should NOT show a constraint to auth.users.

### Check 2: Is your user profile created?
```sql
SELECT * FROM user_profiles WHERE email = 'your-email@example.com';
```

If no rows, log out and log in again.

### Check 3: What user_id is being used?
Add logging to the API:
```typescript
// In app/api/journalist-leads/route.ts line 21
console.log('Inserting with user_id:', session.user.id);
```

Check server logs to see the UUID being used.

### Check 4: Try manual insert
```sql
-- Get your user_id
SELECT id FROM user_profiles LIMIT 1;

-- Try inserting manually
INSERT INTO journalist_leads (
  user_id,
  journalist_name,
  publication,
  subject,
  industry,
  deadline
) VALUES (
  '<paste-your-user-id>',
  'Test',
  'Test',
  'Test',
  'Tech',
  '2025-12-31'
);
```

If this works, the issue is with the session user_id.

## Summary

**Problem:** Foreign key constraint to auth.users
**Solution:** Drop and recreate tables without the constraint
**File:** `db/ONE_CLICK_FIX.sql`
**Time:** 5 minutes
**Data Loss:** Yes (user_profiles, contacts, email_templates, journalist_leads, email_campaigns)
**Leads Table:** Not affected

## After Fix Works

Once you can add journalist leads:
1. ✅ Add some test contacts
2. ✅ Add some test journalist leads
3. ✅ Create email templates
4. ✅ Try the email matcher
5. ✅ View Sway PR dashboard

Everything should work perfectly!

---

**Status:** Ready to fix
**File:** `db/ONE_CLICK_FIX.sql`
**Action:** Copy entire file → Paste in Supabase SQL Editor → Run
