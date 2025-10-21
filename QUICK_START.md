# Quick Start Guide

## 🚀 Get Your App Running in 5 Minutes

### Step 1: Setup Supabase Database (2 minutes)

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to your project → **SQL Editor**
3. **First**, copy and run `db/migrations/0007_verify_all_tables.sql`
4. **Then**, copy and run `db/migrations/0009_remove_foreign_keys_simple.sql`
5. ✅ Done! All tables are created and foreign key constraints are fixed

### Step 2: Verify Tables (30 seconds)

Run this in SQL Editor to confirm:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('leads', 'user_profiles', 'contacts', 'email_templates', 'journalist_leads', 'email_campaigns')
ORDER BY table_name;
```

You should see 6 tables.

### Step 3: Start the Application (1 minute)

The server is already running at:
**[https://3000--0199f1d2-321c-780b-bc7e-3040f949b05b.eu-central-1-01.gitpod.dev](https://3000--0199f1d2-321c-780b-bc7e-3040f949b05b.eu-central-1-01.gitpod.dev)**

If you need to restart:
```bash
cd /workspaces/lead-discovery-appSwayPR
(nohup npm run dev > /dev/null 2>&1 &)
```

### Step 4: Test the App (2 minutes)

1. **Log in** with Google or Microsoft OAuth
2. **Add a Contact:**
   - Go to `/contacts`
   - Click "Add New Contact"
   - Fill in: Name, Email, Company
   - Click Save

3. **Add a Journalist Lead:**
   - Go to `/journalist-leads`
   - Click "Add New Lead"
   - Fill in: Journalist Name, Publication, Subject, Industry, Deadline
   - Click Save

4. **View Sway PR Dashboard:**
   - Go to `/sway-pr`
   - See your active leads
   - Check deadline countdowns

5. **Create Email Template:**
   - Go to `/email-templates`
   - Create Template 1
   - Use variables: `{journalist_name}`, `{publication}`, `{subject}`, `{contact_name}`

6. **Match & Send:**
   - Go to `/email-matcher`
   - Select a journalist lead
   - Select contacts to match
   - Choose template
   - Preview and create campaigns

## ✅ Success Checklist

- [ ] All 6 tables exist in Supabase
- [ ] Can log in with OAuth
- [ ] Can add a contact
- [ ] Can add a journalist lead
- [ ] Can see leads on Sway PR page
- [ ] Can create email template
- [ ] Can match contacts with leads

## 🔧 Troubleshooting

**Can't log in?**
- Check OAuth credentials in `.env.local`
- Verify redirect URLs in Google/Microsoft console

**"relation does not exist" error?**
- Run the migration file again: `db/migrations/0007_verify_all_tables.sql`

**Can't add contacts?**
- Check Supabase connection in `.env.local`
- Verify RLS policies are enabled

**Server not responding?**
- Restart: `pkill -9 node && (nohup npm run dev > /dev/null 2>&1 &)`
- Wait 15 seconds for server to start

## 📚 Documentation

- **Database Setup:** See `DATABASE_SETUP.md`
- **Testing Guide:** See `TESTING_CHECKLIST.md`
- **Authentication:** See `AUTHENTICATION_SETUP.md`

## 🎯 Key Features

### Sway PR (Cold Outreach)
- Track journalist opportunities
- Monitor deadlines
- Match contacts with leads
- Send personalized emails

### Pages
- `/dashboard` - Overview and quick actions
- `/discover` - Find new email leads
- `/sway-pr` - Active journalist opportunities
- `/journalist-leads` - Manage all leads
- `/contacts` - Contact database
- `/email-templates` - Email templates
- `/email-matcher` - Match contacts with leads
- `/email-campaigns` - View sent campaigns

### Database Tables
1. **leads** - Discovered email leads
2. **user_profiles** - User information
3. **contacts** - Personal contact database
4. **email_templates** - Email templates (1-3)
5. **journalist_leads** - Journalist opportunities
6. **email_campaigns** - Campaign tracking

## 🔐 Security

- All tables use Row Level Security (RLS)
- Users can only see their own data
- OAuth authentication required
- UUID-based user identification

## 🚨 Important Notes

⚠️ **Do NOT delete existing Supabase tables** - The migration uses `create table if not exists` to safely add tables without affecting other projects.

✅ **Safe to re-run migrations** - All migrations are idempotent.

## 📞 Need Help?

Check the detailed guides:
- Database issues → `DATABASE_SETUP.md`
- Testing → `TESTING_CHECKLIST.md`
- Authentication → `AUTHENTICATION_SETUP.md`
