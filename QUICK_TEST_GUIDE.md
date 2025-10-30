# Quick Test Guide - Lead Pools & Email Campaigns

## Step 1: Setup Database (One-time)

### Option A: Supabase SQL Editor (Recommended)

1. **Open Supabase SQL Editor:**
   - Go to: https://app.supabase.com/project/zgrfotgxxoceyqslmexw/sql
   - Or: Supabase Dashboard → SQL Editor

2. **Run the migration:**
   - Open file: `db/CREATE_LEAD_POOLS.sql`
   - Copy ALL contents
   - Paste into SQL Editor
   - Click **"Run"**

3. **Verify tables created:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name LIKE '%pool%';
   ```
   
   Should show:
   - `cold_outreach_lead_pools`
   - `cold_outreach_contact_pools`
   - `cold_outreach_pool_stats`
   - `cold_outreach_contact_pool_memberships`

## Step 2: Login

1. **Go to:** `/dev-login`
2. **Click:** "Login as Dev User"
3. **You're now logged in!**

## Step 3: Create a Lead Pool

1. **Navigate to:** `/lead-pools`
2. **Click:** "Create New Pool"
3. **Enter:**
   - Name: "Test Pool"
   - Description: "My first pool"
   - Choose a color
4. **Click:** "Create Pool"

## Step 4: Add Contacts to Pool

### Option A: Add existing contacts

1. **Go to:** `/contacts`
2. **Select contacts** using checkboxes
3. **Click:** "Add X to Pool"
4. **Select:** "Test Pool"
5. **Contacts added!**

### Option B: Create new contacts first

1. **Go to:** `/contacts`
2. **Click:** "Add Contact" (if available)
3. **Fill in contact details:**
   - Email
   - First Name
   - Last Name
   - Company
   - Industry (important for matching!)
4. **Save contact**
5. **Then follow Option A above**

## Step 5: Add Journalist Leads

1. **Go to:** `/journalist-leads`
2. **Add journalist leads** with matching industries
3. **Example:**
   - If your contact is in "Technology" industry
   - Add a journalist who covers "Technology"

## Step 6: Create Campaign with Pool Selection

1. **Go to:** `/campaigns/new`
2. **Enter campaign name:** "Test Campaign"
3. **Create email templates:**
   - Subject: "Hi {{user_first_name}}"
   - Body: "Hello {{user_first_name}}, I saw {{journalist_first_name}} from {{publication}}..."
4. **Click:** "Save & Select Leads"
5. **Select your pool:** Check "Test Pool"
6. **Click:** "Continue to Preview"

## Step 7: Review & Select Leads

1. **Preview page shows:**
   - All contacts from your selected pool
   - Matched with journalists by industry
   - Checkboxes to select/deselect individual contacts
2. **Review the matched pairs**
3. **Select which contacts to send to** (or use "Select All")
4. **Click:** "Start Campaign (X contacts)"

## Step 8: Verify Campaign Started

1. **You'll be redirected to:** `/campaigns/[id]/dashboard`
2. **Check email queue:**
   - Emails should be queued
   - Status: "pending"
3. **Monitor sending:**
   - Emails send based on schedule (9am-5pm, 28/day max)

## Troubleshooting

### "Unauthorized" errors
- **Solution:** Go to `/dev-login` and login again

### No pools showing
- **Solution:** Run the database migration (Step 1)

### No contacts in pool
- **Solution:** Add contacts to the pool (Step 4)

### No matched pairs in preview
- **Solution:** Make sure:
  - Contacts have an industry set
  - Journalist leads have matching industry
  - Both are in the selected pool

### Tables don't exist error
- **Solution:** Run the SQL migration in Supabase SQL Editor

## Quick Commands

```bash
# Start dev server
npm run dev

# Check if server is running
curl http://localhost:3000/api/lead-pools

# View migration SQL
cat db/CREATE_LEAD_POOLS.sql
```

## Test Data Example

### Contact
```
Email: john@techcorp.com
First Name: John
Last Name: Doe
Company: TechCorp
Industry: Technology
```

### Journalist Lead
```
Name: Jane Smith
Publication: Tech Weekly
Subject: Technology News
Industry: Technology
```

### Pool
```
Name: Tech Leads Q1
Description: Technology sector leads for Q1 campaign
Color: Blue (#3B82F6)
```

## Expected Flow

```
Login → Create Pool → Add Contacts → Add Journalists → 
Create Campaign → Select Pool → Review Matches → 
Select Recipients → Start Campaign → Monitor Dashboard
```

## Success Indicators

✅ Pool created and shows in `/lead-pools`
✅ Contacts added to pool (count shows in pool card)
✅ Campaign creation redirects to pool selection
✅ Preview shows matched pairs from selected pool
✅ Can select/deselect individual contacts
✅ Campaign starts and emails are queued
✅ Dashboard shows campaign status

---

**Need Help?**
- Check browser console for errors (F12)
- Check server logs: `tail -f /tmp/dev-server.log`
- Verify database tables exist in Supabase
- Make sure you're logged in via `/dev-login`
