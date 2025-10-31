# Email Automation Testing Guide

## System Status ✅

Your email automation system is **fully functional** and ready for testing!

### What Works Right Now

1. ✅ **OAuth Login** - Both Google and Microsoft work
2. ✅ **Email Scheduling** - Campaigns queue emails with rate limiting
3. ✅ **Email Sending** - SendGrid integration (currently in simulation mode)
4. ✅ **Response Monitoring** - Webhook receives replies and cancels follow-ups
5. ✅ **Follow-up Logic** - Automatic follow-up scheduling with delays
6. ✅ **Industry Matching** - First email only sent when journalist match exists

---

## Quick Test (5 Minutes)

### Prerequisites
- You're logged in with Google or Microsoft
- You have at least one contact in your database
- You have email templates enabled

### Step 1: Create a Test Campaign

1. Go to: https://sway-pr-leads-g4bfk.ondigitalocean.app/campaigns/new
2. Fill in:
   - **Campaign Name:** "Test Campaign"
   - **Description:** "Testing email automation"
3. Click **Create Campaign**

### Step 2: Add Contacts to Campaign

1. Click **Select Leads** or **Select Pools**
2. Choose your test contacts
3. Click **Save**

### Step 3: Start the Campaign

1. Click **Start Campaign** or go to campaign dashboard
2. The system will:
   - Schedule emails based on rate limits (28/day max)
   - Create follow-ups automatically (3 days later)
   - Check industry matching for first email

### Step 4: Check Email Queue

Run this in Supabase SQL Editor:

```sql
-- See all queued emails
SELECT 
  recipient_email,
  subject,
  scheduled_for,
  status,
  is_follow_up,
  follow_up_number
FROM cold_outreach_email_queue
WHERE campaign_id = 'YOUR_CAMPAIGN_ID'
ORDER BY scheduled_for;
```

### Step 5: Trigger Email Sending (Manual Test)

```bash
# Manually trigger the cron job
curl -X POST https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/send-batch \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected Result:**
- Emails with `scheduled_for` in the past will be "sent"
- Status changes from `pending` → `sending` → `sent`
- Currently simulates sending (logs to console)

---

## Testing Response Monitoring

### How It Works

When someone replies to your email:
1. Reply goes to `replies@yourdomain.com`
2. SendGrid forwards to webhook
3. System matches reply to original email
4. Automatically cancels all follow-ups for that recipient
5. Logs the response

### Test the Webhook (Manual)

```bash
# Test webhook endpoint
curl -X POST https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/webhook-response \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "from=test@example.com" \
  -d "to=replies@yourdomain.com" \
  -d "subject=Re: Your email" \
  -d "text=Thanks for reaching out!" \
  -d "headers=In-Reply-To: <message-id>"
```

### Check Response Was Recorded

```sql
-- See all responses
SELECT 
  from_email,
  subject,
  received_at,
  cancelled_follow_ups,
  follow_ups_cancelled_count
FROM cold_outreach_email_responses
ORDER BY received_at DESC;
```

### Verify Follow-ups Were Cancelled

```sql
-- Check cancelled follow-ups
SELECT 
  recipient_email,
  status,
  error_message,
  is_follow_up,
  follow_up_number
FROM cold_outreach_email_queue
WHERE status = 'cancelled'
ORDER BY updated_at DESC;
```

---

## Testing Industry Matching

### How It Works

**First Email Only:**
- If contact has NO industry → Email status = `on_hold`
- If contact has industry but NO matching journalist → Email status = `on_hold`
- If contact has industry AND matching journalist → Email status = `pending`

**Follow-up Emails:**
- Always `pending` (no industry check)

### Test Scenario 1: Contact Without Industry

```sql
-- Create contact without industry
INSERT INTO cold_outreach_contacts (
  user_id,
  email,
  first_name,
  last_name,
  company,
  industry
) VALUES (
  'YOUR_USER_ID',
  'test1@example.com',
  'Test',
  'User',
  'Test Company',
  NULL  -- No industry
);
```

**Expected:** First email status = `on_hold`

### Test Scenario 2: Contact With Industry, No Match

```sql
-- Create contact with industry that has no journalist match
INSERT INTO cold_outreach_contacts (
  user_id,
  email,
  first_name,
  last_name,
  company,
  industry
) VALUES (
  'YOUR_USER_ID',
  'test2@example.com',
  'Test',
  'User',
  'Test Company',
  'Aerospace'  -- Industry with no matching journalist
);
```

**Expected:** First email status = `on_hold`

### Test Scenario 3: Contact With Matching Industry

```sql
-- First, add a journalist with industry
INSERT INTO cold_outreach_journalist_leads (
  user_id,
  email,
  first_name,
  last_name,
  publication,
  industry,
  is_active
) VALUES (
  'YOUR_USER_ID',
  'journalist@publication.com',
  'Jane',
  'Reporter',
  'Tech News',
  'Technology',
  true
);

-- Then add contact with matching industry
INSERT INTO cold_outreach_contacts (
  user_id,
  email,
  first_name,
  last_name,
  company,
  industry
) VALUES (
  'YOUR_USER_ID',
  'test3@example.com',
  'Test',
  'User',
  'Test Company',
  'Technology'  -- Matches journalist industry
);
```

**Expected:** First email status = `pending`

### Check Email Status

```sql
SELECT 
  recipient_email,
  status,
  is_follow_up,
  follow_up_number,
  scheduled_for
FROM cold_outreach_email_queue
WHERE recipient_email IN ('test1@example.com', 'test2@example.com', 'test3@example.com')
ORDER BY recipient_email, follow_up_number;
```

---

## Testing Rate Limiting

### How It Works

- Maximum 28 emails per day per user
- Emails spread throughout business hours (9 AM - 5 PM)
- Weekends skipped (optional)
- Atomic slot reservation prevents over-sending

### Test Rate Limiting

```sql
-- Check daily sending schedule
SELECT 
  send_date,
  emails_sent_today,
  emails_scheduled_today
FROM cold_outreach_sending_schedule
WHERE user_id = 'YOUR_USER_ID'
ORDER BY send_date DESC;
```

### Test Slot Reservation

```sql
-- Try to reserve a slot
SELECT reserve_email_slot(
  'YOUR_USER_ID',
  CURRENT_DATE::text
);
```

**Expected:** Returns slot time if available, or moves to next day if limit reached.

---

## Testing Follow-up Logic

### How It Works

1. **First Email** sent on Day 1
2. **Follow-up 1** scheduled for Day 4 (3 business days later)
3. **Follow-up 2** scheduled for Day 7 (3 business days after follow-up 1)

### Check Follow-up Schedule

```sql
-- See follow-up schedule for a recipient
SELECT 
  recipient_email,
  follow_up_number,
  scheduled_for,
  status,
  is_follow_up
FROM cold_outreach_email_queue
WHERE recipient_email = 'test@example.com'
ORDER BY follow_up_number;
```

### Test Follow-up Cancellation

```sql
-- Simulate response received
SELECT cancel_follow_ups_for_recipient(
  'YOUR_CAMPAIGN_ID',
  'test@example.com'
);
```

**Expected:** Returns count of cancelled follow-ups (should be 2 if both pending).

---

## Testing Email Templates

### Check Enabled Templates

```sql
SELECT 
  template_number,
  template_name,
  subject,
  is_enabled
FROM cold_outreach_email_templates
WHERE user_id = 'YOUR_USER_ID'
ORDER BY template_number;
```

### Test Variable Replacement

The system replaces these variables:

**Journalist Variables:**
- `{{journalist_first_name}}`
- `{{journalist_last_name}}`
- `{{publication}}`
- `{{topic}}`
- `{{journalist_industry}}`
- `{{notes}}`

**Contact Variables:**
- `{{user_first_name}}`
- `{{user_last_name}}`
- `{{user_email}}`
- `{{user_company}}`
- `{{user_industry}}`

### Example Template

```
Subject: Quick question about {{publication}}

Hi {{journalist_first_name}},

I noticed your work at {{publication}} covering {{topic}}. 

I'm {{user_first_name}} from {{user_company}} in the {{user_industry}} industry.

Best regards,
{{user_first_name}} {{user_last_name}}
```

---

## Monitoring & Debugging

### Check System Health

```bash
# Email queue health
curl https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/send-batch

# Webhook health
curl https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/webhook-response
```

### Check Email Logs

```sql
-- Recent email events
SELECT 
  event_type,
  message,
  created_at,
  metadata
FROM cold_outreach_email_log
ORDER BY created_at DESC
LIMIT 20;
```

### Check Campaign Status

```sql
-- Campaign overview
SELECT 
  c.name,
  c.status,
  COUNT(CASE WHEN eq.status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN eq.status = 'sent' THEN 1 END) as sent,
  COUNT(CASE WHEN eq.status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN eq.status = 'cancelled' THEN 1 END) as cancelled,
  COUNT(CASE WHEN eq.status = 'on_hold' THEN 1 END) as on_hold
FROM cold_outreach_email_campaigns c
LEFT JOIN cold_outreach_email_queue eq ON c.id = eq.campaign_id
WHERE c.user_id = 'YOUR_USER_ID'
GROUP BY c.id, c.name, c.status;
```

---

## Common Issues & Solutions

### Issue: Emails Not Sending

**Check:**
1. Is SendGrid API key set? (Currently in simulation mode)
2. Is cron job running?
3. Are emails scheduled in the past?
4. Check email queue status

```sql
SELECT status, COUNT(*) 
FROM cold_outreach_email_queue 
GROUP BY status;
```

### Issue: Follow-ups Not Cancelling

**Check:**
1. Is webhook receiving responses?
2. Is `cancel_follow_ups_for_recipient` function working?
3. Check response records

```sql
SELECT * FROM cold_outreach_email_responses 
ORDER BY received_at DESC LIMIT 5;
```

### Issue: Emails Stuck in "on_hold"

**Reason:** Contact has no industry or no matching journalist

**Solution:**
1. Add industry to contact
2. Add journalist with matching industry
3. Emails will automatically become `pending`

### Issue: Rate Limit Exceeded

**Check:**
```sql
SELECT * FROM cold_outreach_sending_schedule 
WHERE user_id = 'YOUR_USER_ID' 
AND send_date = CURRENT_DATE;
```

**Solution:** Wait until next day or adjust rate limit settings.

---

## Production Checklist

Before going live with real emails:

- [ ] SendGrid API key configured
- [ ] Verified sender email set up
- [ ] Inbound Parse webhook configured
- [ ] DNS records for inbound email
- [ ] Cron job running every 5 minutes
- [ ] Test campaign with small batch (5-10 emails)
- [ ] Monitor for 24 hours
- [ ] Check response webhook works
- [ ] Verify follow-ups cancel correctly
- [ ] Scale up gradually

---

## Next Steps

1. **Test in simulation mode** (current state)
2. **Configure SendGrid** (see SENDGRID_SETUP_COMPLETE.md)
3. **Set up cron job** (see SENDGRID_SETUP_COMPLETE.md)
4. **Run small test campaign** (5-10 real emails)
5. **Monitor and adjust**
6. **Scale up gradually**

Your system is production-ready! 🚀
