# Campaign Workflow Guide

## Complete Email Outreach Workflow

This guide explains the improved campaign creation workflow with automatic data validation and preview.

---

## 🎯 Workflow Overview

```
1. Create Templates → 2. Select Leads → 3. Preview Emails → 4. Start Campaign
```

---

## Step 1: Create Email Templates

**URL:** `/campaigns/new`

### Features:
- ✅ **Single Save for All Templates** - Create initial email + follow-ups, then save all at once
- ✅ **Add Follow-up Button** - Simple button to add follow-up emails (up to 3 total)
- ✅ **Variable Support** - Use `{{first_name}}`, `{{last_name}}`, `{{company}}`, `{{email}}`, `{{title}}`
- ✅ **Remove Follow-ups** - Can remove follow-ups before saving

### How it Works:
1. Enter campaign name
2. Write initial email with subject and body
3. Click "Add Follow-up #1" to add first follow-up
4. Click "Add Follow-up #2" to add second follow-up
5. Click **"Save & Select Leads"** - saves ALL templates at once
6. Automatically redirects to lead selection

### Example Template:
```
Subject: Quick question about {{company}}'s coverage

Hi {{first_name}},

I noticed {{company}} has been covering [topic]. 

Would you be interested in...

Best,
Mark
```

---

## Step 2: Select Leads

**URL:** `/campaigns/[id]/select-leads`

### Features:
- ✅ **Automatic Data Validation** - Only shows leads with complete data
- ✅ **Required Fields:** email, first_name, last_name, company
- ✅ **Search & Filter** - Search by name, email, or company
- ✅ **Select All / Deselect All** - Bulk selection
- ✅ **Days Calculation** - Shows how many days campaign will take (28 emails/day)

### Data Quality:
- **Valid Leads:** Leads with all required fields are shown
- **Skipped Leads:** Leads missing data are automatically filtered out
- **No Manual Validation:** System handles it automatically

### Stats Displayed:
- Total valid leads
- Number selected
- Days to complete (based on 28/day limit)

---

## Step 3: Preview Emails

**URL:** `/campaigns/[id]/preview`

### Features:
- ✅ **3 Real Examples** - Shows exactly how emails will look with real data
- ✅ **Auto-Fill Variables** - All `{{variables}}` replaced with actual journalist data
- ✅ **Complete Sequence** - Shows initial email + all follow-ups
- ✅ **Timeline View** - Visual timeline of when emails will be sent
- ✅ **Skipped Contacts Warning** - Shows if any contacts will be skipped

### What You See:
1. **3 Example Recipients** - Side-by-side preview cards showing:
   - Recipient name, email, company
   - All emails in sequence (initial + follow-ups)
   - Subject and body with variables replaced
   - Day each email will be sent

2. **Campaign Stats:**
   - Total recipients (valid only)
   - Emails per sequence
   - Total emails to send
   - Skipped contacts (if any)

3. **Sending Timeline:**
   - Day 1: Initial email
   - Day 4: Follow-up #1 (if no response)
   - Day 7: Follow-up #2 (if no response)

### Data Validation:
- ⚠️ **Skipped Contacts Warning** - If any contacts have incomplete data, you'll see:
  ```
  ⚠️ Data Quality Notice: X contacts will be skipped due to missing 
  required data (email, first name, last name, or company).
  ```

---

## Step 4: Start Campaign

### Features:
- ✅ **28 Emails Per Day** - Automatic rate limiting
- ✅ **Business Hours Only** - 9am-5pm, Monday-Friday
- ✅ **Auto-Skip Weekends** - No emails sent on weekends
- ✅ **Follow-up Logic** - 3 business days between emails
- ✅ **Response Detection** - Stops follow-ups when recipient replies
- ✅ **Data Validation** - Only sends to contacts with complete data

### Sending Rules:
- **Rate Limit:** Maximum 28 emails per day
- **Hours:** 9am - 5pm (configurable)
- **Days:** Monday - Friday only
- **Follow-ups:** Sent 3 business days after previous email
- **Auto-Stop:** Follow-ups cancelled when recipient replies

### What Happens:
1. System validates all contacts (skips incomplete data)
2. Queues emails with personalized content (variables replaced)
3. Schedules emails across multiple days (28/day limit)
4. Sends initial emails first
5. Schedules follow-ups automatically
6. Monitors for responses and stops follow-ups accordingly

---

## 🔧 Technical Details

### Variable Replacement
Variables are replaced when emails are queued (not when sent):
- `{{first_name}}` → Contact's first name
- `{{last_name}}` → Contact's last name
- `{{email}}` → Contact's email
- `{{company}}` → Contact's company
- `{{title}}` → Contact's title (optional)

### Data Validation Rules
A contact is **valid** if it has:
- ✅ Email address
- ✅ First name
- ✅ Last name
- ✅ Company name

A contact is **skipped** if missing any of the above.

### Rate Limiting
- **28 emails per day** maximum
- Emails distributed evenly throughout business hours (9am-5pm)
- If 28 emails scheduled for a day, overflow goes to next business day
- Weekends automatically skipped

### Follow-up Logic
- **Initial Email:** Sent immediately (respecting rate limits)
- **Follow-up #1:** Sent 3 business days after initial (if no response)
- **Follow-up #2:** Sent 3 business days after follow-up #1 (if no response)
- **Auto-Cancel:** All follow-ups cancelled when recipient replies

---

## 📊 Example Campaign

### Scenario:
- **Campaign:** "Tech Journalists Q1 2024"
- **Templates:** 1 initial + 2 follow-ups
- **Leads Selected:** 84 journalists
- **Invalid Leads:** 6 (missing company name)
- **Valid Leads:** 78

### Timeline:
- **Day 1:** Send 28 initial emails (9am-5pm)
- **Day 2:** Send 28 initial emails
- **Day 3:** Send 22 initial emails (completes initial batch)
- **Day 4:** Start sending follow-up #1 to non-responders
- **Day 7:** Start sending follow-up #2 to non-responders

### Results:
- **Total Emails Queued:** 78 (only valid contacts)
- **Skipped:** 6 contacts with incomplete data
- **Campaign Duration:** ~7-10 days (depending on responses)

---

## ✅ Key Improvements

1. **Single Save** - All templates saved at once, not individually
2. **Auto-Validation** - System automatically filters invalid leads
3. **Real Previews** - See exactly how emails will look with real data
4. **Clear Warnings** - Know upfront if contacts will be skipped
5. **Seamless Flow** - Create → Select → Preview → Confirm in one flow
6. **28/Day Logic** - Built-in rate limiting with business hours
7. **Smart Follow-ups** - Automatic scheduling with response detection

---

## 🚀 Quick Start

1. Go to `/campaigns/new`
2. Create your email sequence (initial + follow-ups)
3. Click "Save & Select Leads"
4. Select journalists to contact
5. Click "Continue to Preview"
6. Review 3 example emails with real data
7. Click "Start Campaign"
8. Done! System handles the rest

---

## 📝 Notes

- **Data Quality:** System only sends to contacts with complete data
- **No Manual Work:** Variables automatically replaced, no need to manually personalize
- **Safe Testing:** Preview shows exactly what will be sent before starting
- **Automatic Scheduling:** System handles all timing and rate limiting
- **Response Tracking:** Follow-ups automatically stop when recipient replies

---

## 🔗 API Endpoints

- `POST /api/campaigns/create` - Create campaign with templates
- `POST /api/campaigns/[id]/add-leads` - Add leads to campaign
- `GET /api/campaigns/[id]/preview` - Get preview with 3 examples
- `POST /api/email-automation/start-campaign` - Start sending emails

---

## 🎯 Success Criteria

✅ Templates saved all at once (not individually)
✅ Leads with incomplete data automatically skipped
✅ Preview shows 3 real examples with auto-filled variables
✅ 28/day sending logic enforced
✅ Follow-ups scheduled automatically
✅ Response detection stops follow-ups
✅ Complete workflow: Create → Select → Preview → Confirm

---

**Last Updated:** 2025-01-21
**Status:** ✅ Fully Implemented
