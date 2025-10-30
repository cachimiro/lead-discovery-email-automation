# 🎯 Auto-Matching Campaign System

## Overview

The campaign system now automatically matches **user leads** (people you're reaching out to) with **journalist leads** (journalists who cover their industry) based on **industry matching**.

---

## How It Works

### 1. **Create Campaign with Variables**

When creating a campaign, you have access to two types of variables:

#### ✍️ **Journalist Variables** (Blue buttons)
Information about the journalist you're pitching to:
- `{{journalist_first_name}}` - Journalist's first name
- `{{journalist_last_name}}` - Journalist's last name
- `{{publication}}` - Publication/media outlet
- `{{topic}}` - Subject/topic they cover
- `{{journalist_industry}}` - Industry they focus on
- `{{notes}}` - Additional notes about the journalist

#### 👤 **Lead Variables** (Green buttons)
Information about the person/company you're reaching out to:
- `{{user_first_name}}` - Lead's first name
- `{{user_last_name}}` - Lead's last name
- `{{user_company}}` - Lead's company name
- `{{user_industry}}` - Lead's industry
- `{{user_email}}` - Lead's email address

### 2. **Auto-Matching by Industry**

When you click **"Save & Preview Matched Pairs"**, the system:

1. Gets all your **user leads** (contacts to reach out to)
2. Gets all your **journalist leads** (journalists in your database)
3. **Automatically matches** them by industry:
   - User lead in "sleep" industry → Journalist covering "sleep" industry
   - User lead in "tech" industry → Journalist covering "tech" industry
   - etc.

### 3. **Preview Matched Pairs**

You'll see 3 example matched pairs showing:
- **User Lead Info** (blue header): Person you're reaching out to
- **Matched Journalist** (green header): Journalist matched by industry
- **Email Preview**: How the email will look with all variables filled

### 4. **Send Campaign**

Click **"🚀 Start Campaign"** and emails are sent automatically with:
- 28 emails per day limit
- Business hours only (9am-5pm)
- Automatic follow-ups
- All variables replaced with real data

---

## Example Workflow

### Step 1: Create Template

```
Subject: {{journalist_first_name}}, story idea for {{publication}}

Hi {{journalist_first_name}},

I noticed {{publication}} has been covering {{topic}} extensively. 

I'm reaching out on behalf of {{user_company}}, a leader in the 
{{user_industry}} industry. {{user_first_name}} {{user_last_name}}, 
their CEO, has an exclusive story about...

Would you be interested in learning more?

Best,
Mark
```

### Step 2: System Auto-Matches

**Example Match:**

**User Lead:**
- Name: John Smith
- Company: SleepTech Inc
- Industry: **sleep**
- Email: john@sleeptech.com

**Matched Journalist:**
- Name: Sarah Johnson
- Publication: TechCrunch
- Topic: Sleep Technology
- Industry: **sleep** ← MATCH!

### Step 3: Email Sent

```
Subject: Sarah, story idea for TechCrunch

Hi Sarah,

I noticed TechCrunch has been covering Sleep Technology extensively.

I'm reaching out on behalf of SleepTech Inc, a leader in the 
sleep industry. John Smith, their CEO, has an exclusive story about...

Would you be interested in learning more?

Best,
Mark
```

---

## Variable Reference

### Journalist Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{journalist_first_name}}` | Journalist's first name | Sarah |
| `{{journalist_last_name}}` | Journalist's last name | Johnson |
| `{{publication}}` | Publication name | TechCrunch |
| `{{topic}}` | Topic they cover | Sleep Technology |
| `{{journalist_industry}}` | Industry focus | sleep |
| `{{notes}}` | Additional notes | Recently wrote about AI |

### Lead Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{user_first_name}}` | Lead's first name | John |
| `{{user_last_name}}` | Lead's last name | Smith |
| `{{user_company}}` | Lead's company | SleepTech Inc |
| `{{user_industry}}` | Lead's industry | sleep |
| `{{user_email}}` | Lead's email | john@sleeptech.com |

---

## Matching Logic

### How Matching Works

```
FOR EACH user lead:
  1. Get user's industry (e.g., "sleep")
  2. Find ALL journalists with matching industry
  3. Create pairs for each match
  4. Queue emails for all pairs
```

### Example Matching

**User Leads:**
- Lead A: Industry = "sleep"
- Lead B: Industry = "tech"
- Lead C: Industry = "sleep"

**Journalist Leads:**
- Journalist 1: Industry = "sleep"
- Journalist 2: Industry = "tech"
- Journalist 3: Industry = "sleep"

**Matched Pairs:**
1. Lead A + Journalist 1 (sleep)
2. Lead A + Journalist 3 (sleep)
3. Lead B + Journalist 2 (tech)
4. Lead C + Journalist 1 (sleep)
5. Lead C + Journalist 3 (sleep)

**Result:** 5 emails will be sent

---

## Requirements

### User Leads Must Have:
- ✅ First name
- ✅ Email address
- ✅ Industry

### Journalist Leads Must Have:
- ✅ Industry (for matching)
- ✅ First name (recommended)
- ✅ Publication (recommended)

### Matching Criteria:
- Industries must match **exactly** (case-insensitive)
- Example: "sleep" matches "Sleep" matches "SLEEP"
- Example: "tech" does NOT match "technology"

---

## Tips for Best Results

### 1. **Consistent Industry Names**
Use the same industry names across user leads and journalist leads:
- ✅ Good: "sleep", "tech", "healthcare"
- ❌ Bad: "sleep tech", "technology", "health care"

### 2. **Complete Data**
Ensure all leads have:
- Industry field filled
- First name
- Email address

### 3. **Use All Variables**
Make emails more personal by using both journalist and lead variables:
```
Hi {{journalist_first_name}},

I'm reaching out on behalf of {{user_company}} in the {{user_industry}} 
industry. I noticed {{publication}} covers {{topic}}...
```

### 4. **Test with Preview**
Always check the preview to see how matched pairs look before sending.

---

## Workflow Comparison

### Old Workflow (Manual):
```
Create Templates → Select Leads Manually → Preview → Send
```

### New Workflow (Auto-Match):
```
Create Templates → Auto-Match by Industry → Preview Pairs → Send
```

**Benefits:**
- ✅ No manual lead selection
- ✅ Automatic industry matching
- ✅ Scales to thousands of leads
- ✅ Ensures relevant journalist-lead pairs

---

## Troubleshooting

### "No matches found"
**Problem:** System can't find matching industries

**Solutions:**
1. Check industry names match exactly
2. Ensure user leads have industry field filled
3. Ensure journalist leads have industry field filled
4. Use consistent naming (e.g., all lowercase)

### "No journalist leads found"
**Problem:** No journalists in database

**Solution:** Add journalist leads first before creating campaign

### "No user leads found"
**Problem:** No contacts to reach out to

**Solution:** Add user contacts/leads first

### Variables not replacing
**Problem:** Variables showing as `{{variable_name}}` in sent emails

**Solution:** Check spelling of variables matches exactly

---

## Example Templates

### Template 1: Initial Pitch
```
Subject: {{journalist_first_name}}, exclusive story for {{publication}}

Hi {{journalist_first_name}},

I noticed {{publication}} has been covering {{topic}} extensively, 
particularly your recent piece on [specific article].

I'm reaching out on behalf of {{user_company}}, a {{user_industry}} 
company that's making waves with [innovation]. {{user_first_name}} 
{{user_last_name}}, their CEO, has an exclusive story about...

Would you have 10 minutes this week for a quick call?

Best,
Mark Hayward
SwayPR
```

### Template 2: Follow-up #1
```
Subject: Re: {{journalist_first_name}}, exclusive story for {{publication}}

Hi {{journalist_first_name}},

Just following up on my previous email about {{user_company}}.

Given {{publication}}'s focus on {{topic}}, I thought this story 
about {{user_industry}} innovation would be particularly relevant 
for your readers.

Let me know if you'd like to learn more.

Best,
Mark
```

### Template 3: Follow-up #2
```
Subject: Last follow-up: {{user_company}} story for {{publication}}

Hi {{journalist_first_name}},

This is my last follow-up. I wanted to make sure you saw this 
opportunity before we move forward with other publications.

{{user_first_name}} at {{user_company}} has a compelling story 
about {{user_industry}} that I think would resonate with 
{{publication}}'s audience.

Happy to send over the details if you're interested.

Best,
Mark
```

---

## Summary

✅ **Auto-matching** by industry
✅ **11 variables** (6 journalist + 5 lead)
✅ **Tooltips** on hover
✅ **No manual selection** needed
✅ **Preview matched pairs** before sending
✅ **28/day automation** with follow-ups

**Result:** Scalable, automated, personalized outreach to the right journalists for each lead!

---

**Status:** ✅ Ready to Use
**Last Updated:** 2025-01-21
