# How to Add Contacts to Pools

## Method 1: From Contacts Page

1. **Go to:** `/contacts`

2. **Select contacts:**
   - Check the boxes next to contacts you want to add
   - You can select multiple contacts

3. **Click:** "Add X to Pool" button
   - This button appears when you have contacts selected

4. **Choose pool:**
   - A modal will appear
   - Click on the pool you want to add contacts to

5. **Done!** Contacts are added to the pool

## Method 2: From Discovered Leads Page

1. **Go to:** `/discovered-leads`

2. **Select leads:**
   - Check the boxes next to leads you want to add
   - You can select multiple leads

3. **Click:** "Add X to Pool" button

4. **Choose pool:**
   - Click on the pool you want to add leads to

5. **Done!** Leads are added to the pool

## Method 3: From Pool Detail Page

1. **Go to:** `/lead-pools`

2. **Click:** "View Contacts" on any pool

3. **Click:** "Add Contacts" or "Add Discovered Leads" button

4. **You'll be redirected to:**
   - `/contacts` or `/discovered-leads`

5. **Select contacts and add them** (follow Method 1 or 2)

## If You Don't Have Any Contacts Yet

### Create Regular Contacts

**Option A: Manual Entry**
1. Go to `/contacts`
2. Look for "Add Contact" button or form
3. Fill in:
   - Email (required)
   - First Name
   - Last Name
   - Company
   - Title
4. Save

**Option B: Import Contacts**
- Check if there's an import feature on `/contacts` page
- You may be able to upload CSV files

### Use Lead Discovery

1. **Go to:** `/discover` or `/ai-lead-discovery`

2. **Search for leads:**
   - Enter search criteria
   - Industry, company type, etc.

3. **Discover leads:**
   - System will find leads for you
   - They appear in `/discovered-leads`

4. **Add to pool:**
   - Go to `/discovered-leads`
   - Select the leads
   - Click "Add to Pool"

## Viewing Contacts in a Pool

1. **Go to:** `/lead-pools`

2. **Click:** "View Contacts" on any pool card

3. **You'll see:**
   - All contacts in that pool
   - Contact details (name, email, company, title)
   - When they were added

4. **You can:**
   - Select contacts to remove from pool
   - Click "Remove X from Pool" to remove selected contacts

## Tips

✅ **Contacts can be in multiple pools**
- Add the same contact to different pools for different campaigns

✅ **Removing from pool doesn't delete the contact**
- It only removes them from that specific pool
- The contact still exists in your database

✅ **Pool count updates automatically**
- When you add/remove contacts, the count updates

✅ **Use pools for campaign targeting**
- Create campaigns and select specific pools
- Only contacts in selected pools will receive emails

## Troubleshooting

**"Add to Pool" button not showing?**
- Make sure you've selected at least one contact (checkbox)
- The button only appears when contacts are selected

**Pool shows 0 contacts but I added some?**
- Refresh the page
- Check if you're logged in (go to `/dev-login`)

**Can't see any contacts to add?**
- You need to create contacts first
- Go to `/contacts` or use lead discovery

**"Pool not found" error?**
- Hard refresh your browser (Ctrl+Shift+R)
- Make sure you're logged in

---

**Quick Test:**
1. Go to `/contacts`
2. If no contacts exist, create one manually
3. Select it with checkbox
4. Click "Add to Pool"
5. Choose your pool
6. Go to `/lead-pools` → "View Contacts"
7. Your contact should appear!
