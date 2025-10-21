# Email Matching & Variable Substitution Guide

## Overview

The system now includes intelligent email matching that:
- ✅ Matches contacts with journalist leads by industry
- ✅ Checks deadlines automatically (expired leads are excluded)
- ✅ Substitutes variables in email templates
- ✅ Creates personalized email campaigns

## How It Works

### 1. Add Journalist Leads

Go to **Journalist Leads** page and add opportunities:

**Example:**
- Journalist Name: Alex Wright
- Publication: Dentsu
- Subject: Sleep specialist / expert to discuss impact of jet lag
- Industry: Sleep
- Deadline: 2025-05-30

### 2. Add Contacts

Go to **Contact Database** and add your contacts with their industry information.

### 3. Create Email Templates

Go to **Email Templates** and create templates with variables:

**Supported Variables:**
- `[name]` or `{first_name}` - Contact's first name
- `{last_name}` - Contact's last name
- `{company}` or `[company name]` - Contact's company
- `{title}` - Contact's job title
- `[Insert name]` - Journalist's name
- `[Insert title]` - Publication name
- `[insert subject]` - Lead subject/topic

**Example Template:**

```
Subject: Media Opportunity - {industry} Expert Needed

Hi [name],

Just wanted to flag up that we are getting quite a few journalists asking for an expert in your industry.

The latest one today came from [Insert name] at the [Insert title] who is planning a piece about [insert subject]. It could be a great opportunity for you and [company name] to submit a statement or quote.

Thought it worth flagging up as media coverage is a great way to raise awareness, build credibility and increase your digital footprint.

That's what we do.

Anyway, I hope the lead above is useful. If you want to chat more about getting into the media, then by all means let me know and we can pop some time in the diary.

All the best,

Mark
```

### 4. Match & Send Emails

Go to **Match & Send Emails** page:

1. **Select Industry** - Choose an industry (e.g., "Sleep")
2. **System automatically:**
   - Finds active leads for that industry (deadline not passed)
   - Shows the most recent active lead
   - If no active leads exist, shows warning
3. **Select Template** - Choose which email template to use
4. **Preview** - See how the email will look with variables replaced
5. **Create Campaigns** - Click to create email campaigns for all contacts

### 5. View Campaigns

Go to **Email Campaigns** page to see all created campaigns with:
- Contact information
- Journalist lead details
- Full email content with variables substituted
- Status tracking

## Deadline Logic

**Automatic Filtering:**
- Only leads with `deadline >= today` are shown
- Expired leads are automatically excluded
- If all leads for an industry are expired, no emails will be created
- System always uses the most recent active lead for each industry

## Variable Substitution Examples

**Before (Template):**
```
Hi [name],

The latest one today came from [Insert name] at the [Insert title] who is planning a piece about [insert subject]. It could be a great opportunity for you and [company name].
```

**After (With Data):**
```
Hi John,

The latest one today came from Alex Wright at Dentsu who is planning a piece about Sleep specialist / expert to discuss impact of jet lag. It could be a great opportunity for you and Sleep Solutions Inc.
```

## Industry Matching

The system matches based on **exact industry name**:
- Contact industry must match Lead industry
- Case-sensitive matching
- Make sure industry names are consistent

**Example:**
- Lead Industry: "Sleep"
- Contact with industry "Sleep" ✅ Matches
- Contact with industry "sleep" ❌ No match (case sensitive)
- Contact with industry "Healthcare" ❌ No match (different industry)

## Workflow Summary

1. **Add Leads** → Journalist opportunities with deadlines
2. **Add Contacts** → Your contact database
3. **Create Templates** → Email templates with variables
4. **Match** → System matches contacts to active leads by industry
5. **Preview** → See personalized email before sending
6. **Create** → Generate email campaigns
7. **View** → Review all campaigns in one place

## Tips

- Keep industry names consistent across leads and contacts
- Set realistic deadlines for leads
- Use clear variable names in templates
- Preview emails before creating campaigns
- Regularly update expired leads with new opportunities

## Pages

- `/journalist-leads` - Manage journalist opportunities
- `/email-matcher` - Match contacts with leads and create campaigns
- `/email-campaigns` - View all created campaigns
- `/email-templates` - Manage email templates
- `/contacts` - Manage contact database
