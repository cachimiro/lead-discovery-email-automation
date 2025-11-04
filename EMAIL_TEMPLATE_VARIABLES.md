# Email Template Variables Guide

## 📧 Available Variables

Use these variables in your email templates to personalize your outreach. Variables are automatically replaced with actual data when emails are sent.

---

## 👤 Contact Variables

These variables pull data from the **contact** you're emailing:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{first_name}}` | Contact's first name | John |
| `{{last_name}}` | Contact's last name | Smith |
| `{{email}}` | Contact's email address | john@company.com |
| `{{company}}` | Contact's company name | Acme Corp |
| `{{title}}` | Contact's job title | CEO |
| `{{industry}}` | Contact's industry | Technology |

### Legacy Names (Still Supported):
- `{{user_first_name}}` → Same as `{{first_name}}`
- `{{user_last_name}}` → Same as `{{last_name}}`
- `{{user_email}}` → Same as `{{email}}`
- `{{user_company}}` → Same as `{{company}}`
- `{{user_industry}}` → Same as `{{industry}}`

---

## 📰 Journalist Variables

These variables pull data from **matched journalist leads** (based on industry matching):

| Variable | Description | Example |
|----------|-------------|---------|
| `{{journalist_first_name}}` | Journalist's first name | Sarah |
| `{{journalist_last_name}}` | Journalist's last name | Johnson |
| `{{journalist_name}}` | Full journalist name | Sarah Johnson |
| `{{publication}}` | Publication name | TechCrunch |
| `{{topic}}` | Story topic/subject | AI in Healthcare |
| `{{journalist_industry}}` | Journalist's industry | Healthcare |
| `{{deadline}}` | Story deadline | 11/15/2025 |
| `{{notes}}` | Additional notes | Looking for expert quotes |

**⚠️ Important:** Journalist variables only work if:
1. The contact has an **industry** set
2. There's a **journalist lead** with a matching industry
3. The journalist's deadline hasn't passed

---

## 📝 Example Templates

### Example 1: Basic Personalization

**Subject:**
```
Quick question for {{first_name}}
```

**Body:**
```
Hi {{first_name}},

I noticed you're the {{title}} at {{company}}. I wanted to reach out because...

Best regards,
Mark
```

**Result:**
```
Subject: Quick question for John

Hi John,

I noticed you're the CEO at Acme Corp. I wanted to reach out because...

Best regards,
Mark
```

---

### Example 2: With Journalist Matching

**Subject:**
```
{{journalist_name}} at {{publication}} - {{topic}}
```

**Body:**
```
Hi {{first_name}},

I saw that {{journalist_first_name}} from {{publication}} is working on a story about {{topic}} (deadline: {{deadline}}).

Given your expertise in {{industry}} at {{company}}, I thought you'd be perfect for this opportunity.

{{notes}}

Would you be interested in being featured?

Best,
Mark
```

**Result (when matched with journalist):**
```
Subject: Sarah Johnson at TechCrunch - AI in Healthcare

Hi John,

I saw that Sarah from TechCrunch is working on a story about AI in Healthcare (deadline: 11/15/2025).

Given your expertise in Healthcare at Acme Corp, I thought you'd be perfect for this opportunity.

Looking for expert quotes

Would you be interested in being featured?

Best,
Mark
```

---

### Example 3: Follow-up Email

**Subject:**
```
Re: {{journalist_name}} at {{publication}}
```

**Body:**
```
Hi {{first_name}},

Just following up on my previous email about the {{publication}} opportunity.

The deadline is {{deadline}}, so I wanted to make sure you didn't miss this chance to share your insights on {{topic}}.

Let me know if you're interested!

Best,
Mark
```

---

## 🔍 How Industry Matching Works

### Step 1: Contact Has Industry
```
Contact: John Smith
Industry: Healthcare
```

### Step 2: System Finds Matching Journalist
```
Journalist: Sarah Johnson
Publication: TechCrunch
Industry: Healthcare ✅ MATCH
Deadline: 11/15/2025 (future) ✅ VALID
```

### Step 3: Variables Are Replaced
All journalist variables in your template are replaced with Sarah's data.

### If No Match:
- Email is put **on hold** until a matching journalist is added
- Journalist variables will be **empty** (blank)
- Contact variables still work normally

---

## ⚠️ Common Issues

### Issue 1: Variables Show as Empty

**Problem:** `{{journalist_name}}` shows as blank in sent email

**Causes:**
1. Contact has no industry set
2. No journalist lead matches the contact's industry
3. Journalist's deadline has passed

**Solution:**
- Add industry to contact
- Add journalist lead with matching industry
- Ensure journalist deadline is in the future

---

### Issue 2: Variables Not Replaced

**Problem:** Email shows `{{first_name}}` literally instead of "John"

**Causes:**
1. Typo in variable name (e.g., `{{firstname}}` instead of `{{first_name}}`)
2. Extra spaces (e.g., `{{ first_name }}`)

**Solution:**
- Use exact variable names from this guide
- No spaces inside `{{ }}`
- Use underscores, not hyphens

---

## ✅ Best Practices

### 1. Always Use Contact Variables
These always work because every contact has this data:
- `{{first_name}}`
- `{{company}}`

### 2. Provide Fallback Text for Journalist Variables
Instead of:
```
{{journalist_name}} is working on {{topic}}
```

Use:
```
I found a great media opportunity about {{topic}}
```

This way, if no journalist is matched, the email still makes sense.

### 3. Test Your Templates
1. Create a test contact with all fields filled
2. Add a test journalist lead with matching industry
3. Create a campaign with 1 contact
4. Check the email preview before sending

### 4. Check Industry Matching
Before starting a campaign:
1. Go to Contacts page
2. Verify contacts have industries set
3. Go to Journalist Leads page
4. Verify you have leads for those industries
5. Check deadlines are in the future

---

## 📊 Variable Availability by Email Type

| Variable Type | First Email | Follow-up #2 | Follow-up #3 |
|---------------|-------------|--------------|--------------|
| Contact Variables | ✅ Always | ✅ Always | ✅ Always |
| Journalist Variables | ✅ If matched | ✅ If matched | ✅ If matched |

**Note:** All emails (first and follow-ups) use the same journalist match based on the contact's industry.

---

## 🧪 Testing Variables

### Test in Campaign Preview
1. Go to Campaigns
2. Click on a campaign
3. Click "Preview Emails"
4. Check that all variables are replaced correctly

### Test with Diagnostic Tool
1. Go to `/campaigns/diagnostic`
2. Check "Email Queue" section
3. Look at subject and body preview
4. Verify variables are replaced

---

## 🆘 Troubleshooting

### Check Variable Replacement in Database

```sql
-- Check how variables were replaced in queued emails
SELECT 
  recipient_email,
  subject,
  LEFT(body, 200) as body_preview,
  status
FROM cold_outreach_email_queue
WHERE campaign_id = 'YOUR_CAMPAIGN_ID'
ORDER BY created_at DESC
LIMIT 5;
```

Look for:
- Are variables replaced with actual data?
- Or do you see `{{variable_name}}` literally?

### Check Contact Data

```sql
-- Verify contact has all required data
SELECT 
  email,
  first_name,
  last_name,
  company,
  title,
  industry
FROM cold_outreach_contacts
WHERE email = 'contact@example.com';
```

### Check Journalist Matching

```sql
-- Check if journalist exists for contact's industry
SELECT 
  journalist_name,
  publication,
  industry,
  deadline,
  is_active
FROM cold_outreach_journalist_leads
WHERE industry = 'Healthcare'
  AND deadline >= CURRENT_DATE
  AND is_active = true;
```

---

## 📚 Quick Reference

### Most Common Variables:
```
{{first_name}}
{{company}}
{{journalist_name}}
{{publication}}
{{topic}}
```

### Full Contact Set:
```
{{first_name}} {{last_name}}
{{title}} at {{company}}
{{industry}}
{{email}}
```

### Full Journalist Set:
```
{{journalist_name}} ({{journalist_first_name}} {{journalist_last_name}})
{{publication}}
{{topic}}
{{journalist_industry}}
{{deadline}}
{{notes}}
```

---

## 🎯 Summary

1. **Contact variables** always work (pulled from contact data)
2. **Journalist variables** only work when industry matches
3. Use exact variable names (case-sensitive, with underscores)
4. No spaces inside `{{ }}`
5. Test templates before sending to full list
6. Check industry matching is working
7. Provide fallback text for journalist variables

**Need help?** Check the diagnostic page at `/campaigns/diagnostic` to see if variables are being replaced correctly.
