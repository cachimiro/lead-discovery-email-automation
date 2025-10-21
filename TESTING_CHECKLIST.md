# Testing Checklist

## Database Setup Verification

### Step 1: Run Database Migration
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `db/migrations/0007_verify_all_tables.sql`
3. Click "Run" to execute the migration
4. Verify no errors appear

### Step 2: Verify Tables Exist
Run this query in Supabase SQL Editor:
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

Expected result: 6 tables listed

## Application Testing

### Authentication
- [ ] Can log in with Google OAuth
- [ ] Can log in with Microsoft OAuth
- [ ] User profile is created in `user_profiles` table
- [ ] User ID is correctly generated from OAuth ID

### Contacts Management
**Page:** `/contacts`

- [ ] Can view contacts page
- [ ] Can add a new contact with all fields
- [ ] Contact appears in the list immediately
- [ ] Can delete a contact
- [ ] Cannot add duplicate email for same user
- [ ] Contacts are user-specific (RLS working)

**Test Data:**
```
First Name: John
Last Name: Doe
Email: john.doe@example.com
Company: Example Corp
Title: Marketing Director
Notes: Met at conference
```

### Journalist Leads Management
**Page:** `/journalist-leads`

- [ ] Can view journalist leads page
- [ ] Can add a new journalist lead
- [ ] Lead appears in the list
- [ ] Can see deadline countdown
- [ ] Can mark lead as inactive
- [ ] Can delete a lead
- [ ] Leads are user-specific (RLS working)

**Test Data:**
```
Journalist Name: Jane Smith
Publication: Tech Weekly
Subject: AI in Marketing
Industry: Technology
Deadline: [Tomorrow's date]
Notes: Looking for expert quotes
```

### Sway PR Page
**Page:** `/sway-pr`

- [ ] Can view Sway PR page
- [ ] Shows count of active leads
- [ ] Shows upcoming deadlines count
- [ ] Shows past deadline count
- [ ] Lists all active journalist leads
- [ ] Shows urgent badge for leads with <3 days
- [ ] Shows past due badge for expired leads
- [ ] "Match & Send" button links to email matcher

### Email Templates
**Page:** `/email-templates`

- [ ] Can view email templates page
- [ ] Can create Template 1
- [ ] Can create Template 2
- [ ] Can create Template 3
- [ ] Can edit existing templates
- [ ] Templates support variables: {journalist_name}, {publication}, {subject}, {contact_name}, {contact_company}
- [ ] Cannot create duplicate template numbers

**Test Template:**
```
Subject: RE: {subject}
Body: Hi {journalist_name},

I saw your request on {publication} about {subject}. I have a great contact who would be perfect for this story.

{contact_name} from {contact_company} is an expert in this field.

Best regards
```

### Email Matcher
**Page:** `/email-matcher`

- [ ] Can view email matcher page
- [ ] Can select a journalist lead
- [ ] Can select contacts to match
- [ ] Can choose template (1, 2, or 3)
- [ ] Preview shows variables replaced correctly
- [ ] Can create draft campaigns
- [ ] Campaigns appear in email campaigns list

### Email Campaigns
**Page:** `/email-campaigns`

- [ ] Can view email campaigns page
- [ ] Shows all created campaigns
- [ ] Shows campaign status (draft/sent/failed)
- [ ] Shows journalist lead details
- [ ] Shows contact details
- [ ] Can view campaign details
- [ ] Campaigns are user-specific (RLS working)

### Dashboard
**Page:** `/dashboard`

- [ ] Shows personalized greeting
- [ ] Shows correct time-based greeting (morning/afternoon/evening)
- [ ] Shows quick stats (placeholder data)
- [ ] Quick action cards link to correct pages
- [ ] Lead Discovery card shows all discovery tools
- [ ] Blue gradient header displays correctly

### Lead Discovery
**Page:** `/discover`

- [ ] Can view unified discovery page
- [ ] All 4 discovery methods visible:
  - Find Person (by name)
  - Decision Maker (by role)
  - Company Emails (bulk find)
  - LinkedIn (from URL)
- [ ] Forms are functional
- [ ] Can submit discovery requests

## API Endpoints Testing

### Contacts API
```bash
# Test POST /api/contacts
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User",
    "company": "Test Corp",
    "title": "Manager"
  }'

# Test DELETE /api/contacts
curl -X DELETE "http://localhost:3000/api/contacts?id=<contact-id>"
```

### Journalist Leads API
```bash
# Test POST /api/journalist-leads
curl -X POST http://localhost:3000/api/journalist-leads \
  -H "Content-Type: application/json" \
  -d '{
    "journalist_name": "Test Journalist",
    "publication": "Test Publication",
    "subject": "Test Subject",
    "industry": "Technology",
    "deadline": "2025-12-31"
  }'

# Test DELETE /api/journalist-leads
curl -X DELETE "http://localhost:3000/api/journalist-leads?id=<lead-id>"
```

### Email Campaigns API
```bash
# Test POST /api/email-campaigns
curl -X POST http://localhost:3000/api/email-campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "campaigns": [{
      "journalist_lead_id": "<lead-id>",
      "contact_id": "<contact-id>",
      "template_number": 1,
      "subject": "Test Subject",
      "body": "Test Body"
    }]
  }'

# Test GET /api/email-campaigns
curl http://localhost:3000/api/email-campaigns
```

## Database Integrity Checks

### Check RLS Policies
```sql
-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'leads', 'user_profiles', 'contacts', 
  'email_templates', 'journalist_leads', 'email_campaigns'
);
```
All should show `rowsecurity = true`

### Check Foreign Keys
```sql
-- Verify foreign key relationships
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN (
  'leads', 'contacts', 'email_templates', 
  'journalist_leads', 'email_campaigns'
);
```

### Check Indexes
```sql
-- Verify indexes exist
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'leads', 'contacts', 'email_templates', 
  'journalist_leads', 'email_campaigns'
)
ORDER BY tablename, indexname;
```

## Common Issues & Solutions

### Issue: "relation does not exist"
**Solution:** Run the migration file `0007_verify_all_tables.sql` in Supabase SQL Editor

### Issue: "permission denied for table"
**Solution:** 
1. Check RLS is enabled
2. Verify policies exist
3. Ensure you're logged in with OAuth

### Issue: "duplicate key value violates unique constraint"
**Solution:** This is expected behavior - check unique constraints:
- contacts: (user_id, email)
- email_templates: (user_id, template_number)
- leads: (email, company_domain)

### Issue: "insert or update on table violates foreign key constraint"
**Solution:** Ensure referenced records exist:
- email_campaigns requires existing journalist_lead_id and contact_id
- All user-related tables require valid user_id from auth.users

### Issue: UUID error when adding contacts
**Solution:** This was fixed with UUID generation from OAuth IDs. If still occurring:
1. Check `lib/auth-config.ts` has `generateUuidFromOAuthId` function
2. Verify it's being used in signIn and session callbacks

## Success Criteria

✅ All 6 tables exist in Supabase
✅ RLS is enabled on all tables
✅ Can log in with OAuth
✅ Can add, view, edit, and delete contacts
✅ Can add, view, and delete journalist leads
✅ Can create email templates
✅ Can match contacts with leads
✅ Can create email campaigns
✅ All data is user-specific (can't see other users' data)
✅ No console errors in browser
✅ No server errors in logs

## Next Steps After Testing

1. ✅ Verify all tables exist
2. ✅ Test each CRUD operation
3. ✅ Verify RLS policies work
4. ✅ Test complete workflow: Add contact → Add lead → Create template → Match & Send
5. Document any issues found
6. Fix any bugs discovered
7. Add more test data for realistic testing
