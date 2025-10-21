# Update to Cold Outreach Tables

## What This Does

Creates **brand new tables** with `cold_outreach_` prefix:
- `cold_outreach_user_profiles`
- `cold_outreach_contacts`
- `cold_outreach_email_templates`
- `cold_outreach_journalist_leads`
- `cold_outreach_email_campaigns`

Your existing tables (`user_profiles`, `contacts`, etc.) will **NOT be touched** - they remain for your live project.

## Step 1: Create New Tables in Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
2. Copy entire contents of `db/CREATE_COLD_OUTREACH_TABLES.sql`
3. Paste and click "Run"
4. Check output says "✅ SUCCESS! Cold Outreach tables created!"

## Step 2: Update Application Code

The application needs to be updated to use the new table names. I'll update:

### Files to Update:
1. `lib/auth-config.ts` - Change `user_profiles` to `cold_outreach_user_profiles`
2. `app/api/contacts/route.ts` - Change `contacts` to `cold_outreach_contacts`
3. `app/api/journalist-leads/route.ts` - Change `journalist_leads` to `cold_outreach_journalist_leads`
4. `app/api/email-templates/route.ts` - Change `email_templates` to `cold_outreach_email_templates`
5. `app/api/email-campaigns/route.ts` - Change `email_campaigns` to `cold_outreach_email_campaigns`
6. All page components that fetch data

### Table Name Mapping:
| Old Name | New Name |
|----------|----------|
| `user_profiles` | `cold_outreach_user_profiles` |
| `contacts` | `cold_outreach_contacts` |
| `email_templates` | `cold_outreach_email_templates` |
| `journalist_leads` | `cold_outreach_journalist_leads` |
| `email_campaigns` | `cold_outreach_email_campaigns` |

## Benefits

✅ **No conflicts** - Your live project tables are untouched
✅ **No foreign key errors** - New tables have no constraints to auth.users
✅ **Clean separation** - Cold outreach data is completely separate
✅ **Safe** - Can't accidentally affect live data

## Next Steps

After creating tables in Supabase, I'll update all the application code to use the new table names.
