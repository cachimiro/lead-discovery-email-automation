# Lead Pools Migration - Fixed Version

## Issue

The original SQL migration referenced `c.industry` column which doesn't exist in `cold_outreach_contacts` table.

## Solution

The fixed version (`db/CREATE_LEAD_POOLS.sql`) has been updated to:
- Remove `industry` from the `cold_outreach_contact_pool_memberships` view
- Remove `industry` from the `get_contacts_in_pools` function
- Use `title` instead (which exists in the table)

## How to Run

### Step 1: Open Supabase SQL Editor

Go to: https://app.supabase.com/project/zgrfotgxxoceyqslmexw/sql

### Step 2: Copy and Run the Fixed SQL

Copy the entire contents of `db/CREATE_LEAD_POOLS.sql` and paste into the SQL editor, then click **Run**.

### Step 3: Verify Tables Created

Run this query to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%pool%' 
  AND table_schema = 'public';
```

Expected results:
- `cold_outreach_lead_pools`
- `cold_outreach_contact_pools`

### Step 4: Verify Views Created

```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_name LIKE '%pool%' 
  AND table_schema = 'public';
```

Expected results:
- `cold_outreach_pool_stats`
- `cold_outreach_contact_pool_memberships`

### Step 5: Verify Functions Created

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%pool%' 
  AND routine_schema = 'public';
```

Expected results:
- `add_contacts_to_pool`
- `remove_contacts_from_pool`
- `get_contacts_in_pools`
- `update_pool_updated_at`

## If You Get Errors

### "relation already exists"
This is OK - it means the table was already created. Continue with the rest of the migration.

### "function already exists"
This is OK - the function will be replaced with the new version.

### Other errors
Copy the error message and check:
1. Are you using the correct Supabase project?
2. Do you have admin permissions?
3. Is the SQL syntax correct?

## After Migration

1. Restart your dev server: `npm run dev`
2. Go to `/dev-login` and login
3. Navigate to `/lead-pools`
4. Create your first pool!

## Note About Industry Matching

The lead pools system works with **discovered leads** (which have industry data), not regular contacts.

When you create a campaign:
1. Select pools containing discovered leads
2. System matches by industry with journalist leads
3. You can then select individual contacts to send to

Regular contacts in `cold_outreach_contacts` don't have industry data, so they won't be matched automatically. Use discovered leads for industry-based matching.
