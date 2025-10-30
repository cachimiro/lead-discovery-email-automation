# Industry Matching & Campaign Rules

## ✅ What's Been Implemented

### 1. Campaigns ARE Being Saved
- ✅ All campaigns are saved to the database
- ✅ Campaign status tracked (draft, active, completed)
- ✅ Email templates stored and reusable

### 2. Industry Validation System

#### For Contacts WITHOUT Industry:
- ⚠️ **Popup appears** when viewing campaign preview
- 📝 **Option to add industry** directly from the modal
- ✅ **Can proceed without updating** - contact added to campaign
- ❌ **Won't receive first email** until industry is set and matches
- ✅ **Will receive follow-up emails** regardless of industry

#### For Contacts WITH Non-Matching Industry:
- ℹ️ **Warning shown** in campaign preview
- ✅ **Added to campaign** automatically
- ❌ **Won't receive first email** until industry matches a journalist
- ✅ **Will receive follow-up emails** regardless of match

#### For Contacts WITH Matching Industry:
- ✅ **Added to campaign** automatically
- ✅ **Receives first email** immediately (when campaign starts)
- ✅ **Receives all follow-up emails**

---

## 📧 Email Sending Rules

### First Email (Email #1):
**REQUIRES industry match:**
- Contact must have an industry set
- Industry must match at least one journalist lead
- If no match: Email status = `on_hold`
- Email won't send until conditions are met

### Follow-Up Emails (Email #2, #3, etc.):
**NO industry check:**
- Always scheduled regardless of industry
- Status always = `pending`
- Will send on schedule even if industry doesn't match

---

## 🔄 How It Works

### Campaign Creation Flow:

1. **Create Campaign**
   - Name your campaign
   - Set up email templates
   - Campaign saved to database ✅

2. **Select Lead Pools**
   - Choose which pools to include
   - Add contacts via "Quick Add" modal
   - Contacts added to campaign ✅

3. **Preview Campaign**
   - System checks all contacts
   - **If contacts missing industry:**
     - Modal appears with list
     - Option to add industry for each
     - Can skip and continue
   - **If contacts have non-matching industry:**
     - Warning shown
     - Can still proceed
   - Shows preview of matched emails

4. **Start Campaign**
   - First emails queued:
     - `pending` if industry matches
     - `on_hold` if no industry or no match
   - Follow-up emails queued:
     - Always `pending` (no industry check)

---

## 🎯 Industry Update Options

### Option 1: During Campaign Preview
1. Modal appears showing contacts without industry
2. Click "Add Industry" for each contact
3. Select from dropdown
4. Click "Save Industry"
5. Preview refreshes automatically

### Option 2: From Contacts Page
1. Go to `/contacts`
2. Edit contact
3. Add/update industry field
4. Save changes

### Option 3: API Endpoint
```
PATCH /api/contacts/[id]/update-industry
Body: { "industry": "Technology" }
```

---

## 📊 Email Queue Status

### Status Values:

| Status | Meaning | When Used |
|--------|---------|-----------|
| `pending` | Ready to send | Industry matches (first email) OR any follow-up |
| `on_hold` | Waiting for conditions | No industry or no match (first email only) |
| `sent` | Email delivered | After successful send |
| `failed` | Send failed | Error during sending |

---

## 🔍 Checking Campaign Status

### View Queued Emails:
```sql
SELECT * FROM cold_outreach_email_queue 
WHERE campaign_id = 'your-campaign-id'
ORDER BY scheduled_for;
```

### Check On-Hold Emails:
```sql
SELECT * FROM cold_outreach_email_queue 
WHERE status = 'on_hold' 
AND is_follow_up = false;
```

### Update On-Hold Email to Pending:
When a contact's industry is updated and now matches:
```sql
UPDATE cold_outreach_email_queue 
SET status = 'pending' 
WHERE contact_id = 'contact-id' 
AND is_follow_up = false 
AND status = 'on_hold';
```

---

## 💡 Best Practices

### 1. Add Industries Before Creating Campaigns
- Ensure all contacts have industries set
- Reduces on-hold emails
- Better campaign performance

### 2. Match Industries to Journalist Leads
- Check what journalist industries you have
- Assign matching industries to contacts
- More first emails will send

### 3. Review Preview Warnings
- Pay attention to industry warnings
- Update contacts as needed
- Understand which contacts won't get first email

### 4. Monitor On-Hold Emails
- Check campaign dashboard
- Update contact industries
- Emails will automatically become pending

---

## 🚀 Example Workflow

### Scenario: Tech Startup Campaign

1. **Setup:**
   - Have journalist leads in "Technology" industry
   - Have contacts in various industries

2. **Create Campaign:**
   - Name: "Tech Startup Outreach"
   - 3 email templates ready

3. **Select Contacts:**
   - Add from "Tech Startups" pool
   - Some have "Technology" industry ✅
   - Some have "Healthcare" industry ⚠️
   - Some have no industry ❌

4. **Preview Shows:**
   - Modal: "3 contacts missing industry"
   - Warning: "2 contacts with non-matching industry"
   - Preview: "5 contacts with matching industry"

5. **Actions:**
   - Update 3 contacts without industry
   - Note: 2 healthcare contacts won't get first email
   - Proceed with campaign

6. **Result:**
   - 8 first emails queued as `pending`
   - 2 first emails queued as `on_hold`
   - 30 follow-up emails queued as `pending` (all 10 contacts × 3 emails)

---

## 🆘 Troubleshooting

### "No matches found" error
- Check if contacts have industries set
- Verify journalist leads exist
- Ensure industries match exactly (case-insensitive)

### Contacts not receiving first email
- Check if contact has industry
- Verify industry matches a journalist lead
- Check email queue status (`on_hold` vs `pending`)

### Follow-ups not sending
- Follow-ups should always send
- Check email queue for errors
- Verify SendGrid configuration

---

## 📝 Summary

**Key Points:**
1. ✅ Campaigns are saved to database
2. ⚠️ First email requires industry match
3. ✅ Follow-ups don't require industry match
4. 📝 Popup helps add missing industries
5. ℹ️ Warnings shown for non-matching industries
6. 🔄 Contacts always added to campaign
7. ⏸️ On-hold emails wait for industry match

**Remember:** The industry requirement only affects the FIRST email. All follow-up emails will send regardless of industry matching!
