# Database Status & Setup Summary

## ✅ Current Status

**Application:** Running successfully
**Server:** [https://3000--0199f1d2-321c-780b-bc7e-3040f949b05b.eu-central-1-01.gitpod.dev](https://3000--0199f1d2-321c-780b-bc7e-3040f949b05b.eu-central-1-01.gitpod.dev)
**Database:** Supabase (requires table setup)

## 📋 Required Tables

Your application needs these 6 tables in Supabase:

| Table | Purpose | Status |
|-------|---------|--------|
| `leads` | Discovered email leads | ⚠️ Needs verification |
| `user_profiles` | User profile data | ⚠️ Needs verification |
| `contacts` | Personal contact database | ⚠️ Needs verification |
| `email_templates` | Email templates (1-3) | ⚠️ Needs verification |
| `journalist_leads` | Journalist opportunities | ⚠️ Needs verification |
| `email_campaigns` | Campaign tracking | ⚠️ Needs verification |

## 🚀 Setup Instructions

### Option 1: Quick Setup (Recommended)

1. Open Supabase Dashboard → SQL Editor
2. Run the file: `db/migrations/0007_verify_all_tables.sql`
3. Done! All tables will be created

### Option 2: Manual Setup

Run each migration file in order:
1. `0001_init.sql` - Creates leads table
2. `0004_auth_tables.sql` - Creates user_profiles, contacts, email_templates
3. `0005_auth_policies.sql` - Sets up RLS policies
4. `0006_journalist_leads.sql` - Creates journalist_leads and email_campaigns

## 🔍 Verification

After running the migration, verify tables exist:

```sql
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
)
ORDER BY table_name;
```

Expected result: 6 rows

## 🔐 Security Features

All tables include:
- ✅ Row Level Security (RLS) enabled
- ✅ User-specific data isolation
- ✅ Policies for SELECT, INSERT, UPDATE, DELETE
- ✅ Foreign key constraints
- ✅ Indexes for performance

## 📊 Table Relationships

```
auth.users (Supabase Auth)
    ↓
user_profiles (1:1)
    ↓
├── contacts (1:many)
├── email_templates (1:3)
├── journalist_leads (1:many)
└── email_campaigns (1:many)
        ↓
    ├── journalist_leads (many:1)
    └── contacts (many:1)
```

## 🧪 Testing

After setup, test each feature:

1. **Authentication**
   - Log in with Google/Microsoft OAuth
   - Verify user_profile is created

2. **Contacts**
   - Add a contact at `/contacts`
   - Verify it appears in the list
   - Check Supabase: `SELECT * FROM contacts;`

3. **Journalist Leads**
   - Add a lead at `/journalist-leads`
   - Verify it appears in the list
   - Check Supabase: `SELECT * FROM journalist_leads;`

4. **Sway PR Dashboard**
   - Visit `/sway-pr`
   - See active leads with deadlines
   - Verify counts are correct

5. **Email Templates**
   - Create templates at `/email-templates`
   - Check Supabase: `SELECT * FROM email_templates;`

6. **Email Campaigns**
   - Match contacts with leads at `/email-matcher`
   - Create campaigns
   - Check Supabase: `SELECT * FROM email_campaigns;`

## ⚠️ Important Notes

### Do NOT Delete Existing Tables
The Supabase database may contain other projects. The migration uses:
- `create table if not exists` - Safe to run multiple times
- Will NOT affect existing tables
- Will NOT delete any data

### Safe to Re-run
All migrations are idempotent:
- Can be run multiple times
- Will not create duplicates
- Will not cause errors if tables exist

### RLS Policies
All tables use `auth.uid()` to ensure:
- Users only see their own data
- No cross-user data leakage
- Secure multi-tenant architecture

## 🐛 Common Issues

### "relation does not exist"
**Cause:** Table not created
**Fix:** Run `0007_verify_all_tables.sql`

### "permission denied for table"
**Cause:** RLS policy missing
**Fix:** Run `0007_verify_all_tables.sql` (includes policies)

### "duplicate key value violates unique constraint"
**Cause:** Trying to add duplicate data
**Fix:** This is expected behavior, check unique constraints:
- contacts: (user_id, email)
- email_templates: (user_id, template_number)

### "insert or update violates foreign key constraint"
**Cause:** Referenced record doesn't exist
**Fix:** Ensure parent records exist:
- email_campaigns needs existing journalist_lead_id and contact_id
- All tables need valid user_id from auth.users

## 📁 Migration Files

All migration files are in `db/migrations/`:

- `0001_init.sql` - Initial leads table
- `0002_indexes.sql` - (empty, reserved)
- `0003_policies.sql` - (empty, reserved)
- `0004_auth_tables.sql` - User tables
- `0005_auth_policies.sql` - RLS policies
- `0006_journalist_leads.sql` - Journalist features
- `0007_verify_all_tables.sql` - **Complete setup (use this)**

## 📚 Documentation

- **Quick Start:** `QUICK_START.md` - Get running in 5 minutes
- **Database Setup:** `DATABASE_SETUP.md` - Detailed table schemas
- **Testing:** `TESTING_CHECKLIST.md` - Complete testing guide
- **Authentication:** `AUTHENTICATION_SETUP.md` - OAuth setup

## ✅ Next Steps

1. [ ] Run migration: `0007_verify_all_tables.sql`
2. [ ] Verify 6 tables exist
3. [ ] Log in to the application
4. [ ] Add a test contact
5. [ ] Add a test journalist lead
6. [ ] View Sway PR dashboard
7. [ ] Create email template
8. [ ] Test email matcher

## 🎯 Success Criteria

Your setup is complete when:
- ✅ All 6 tables exist in Supabase
- ✅ RLS is enabled on all tables
- ✅ Can log in with OAuth
- ✅ Can add and view contacts
- ✅ Can add and view journalist leads
- ✅ Sway PR page shows active leads
- ✅ Can create email templates
- ✅ Can match contacts with leads
- ✅ No errors in browser console
- ✅ No errors in server logs

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review `DATABASE_SETUP.md` for detailed schemas
3. Check `TESTING_CHECKLIST.md` for testing procedures
4. Verify environment variables in `.env.local`

---

**Last Updated:** 2025-10-19
**Migration Version:** 0007
**Application Status:** ✅ Running
**Database Status:** ⚠️ Requires setup
