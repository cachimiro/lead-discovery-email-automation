# Troubleshooting: Emails Stuck in Pending

## Quick Diagnostic Checklist

### 1. Check Database for Pending Emails

Run this in Supabase SQL Editor:

```sql
-- Check pending emails
SELECT 
  id,
  recipient_email,
  scheduled_for,
  status,
  created_at,
  NOW() as current_time,
  (scheduled_for <= NOW()) as should_send_now
FROM cold_outreach_email_queue
WHERE status = 'pending'
ORDER BY scheduled_for ASC
LIMIT 10;
```

**What to look for:**
- Are there emails with `should_send_now = true`?
- Is `scheduled_for` in the past?
- If `scheduled_for` is in the future, emails won't send yet

---

### 2. Check OAuth Tokens

```sql
-- Check if user has OAuth tokens
SELECT 
  user_id,
  provider,
  token_type,
  expires_at,
  created_at,
  updated_at
FROM cold_outreach_oauth_tokens
WHERE user_id = 'YOUR_USER_ID';
```

**What to look for:**
- Does the user have tokens stored?
- Has `expires_at` passed? (Token might be expired)
- Is `provider` set to 'google' or 'microsoft'?

---

### 3. Check User Profile Email

```sql
-- Check user email
SELECT id, email, full_name
FROM cold_outreach_user_profiles
WHERE id = 'YOUR_USER_ID';
```

**What to look for:**
- Is `email` field populated?
- This is the email used to send from

---

### 4. Test Send-Batch Endpoint Manually

**Get your production URL** (e.g., from DigitalOcean, Vercel, etc.)

```bash
curl -X POST https://YOUR-DOMAIN.com/api/email-automation/send-batch \
  -H "Authorization: Bearer BwhRI4XQSocArFsYRFt6qIzX48UOXLgTDrvca+ZVYGQ=" \
  -v
```

**Expected responses:**

✅ **Success (no emails due):**
```json
{
  "success": true,
  "message": "No emails to send",
  "processed": 0
}
```

✅ **Success (emails sent):**
```json
{
  "success": true,
  "message": "Batch processing complete",
  "stats": {
    "processed": 5,
    "successful": 5,
    "failed": 0
  }
}
```

❌ **Unauthorized (wrong secret):**
```json
{
  "error": "Unauthorized"
}
```

---

### 5. Check Cron Job Configuration

Go to [cron-job.org](https://cron-job.org) and verify:

- [ ] Cron job is **enabled**
- [ ] URL is correct: `https://YOUR-DOMAIN.com/api/email-automation/send-batch`
- [ ] Schedule is `*/5 * * * *` (every 5 minutes)
- [ ] Method is **POST**
- [ ] Header is set: `Authorization: Bearer BwhRI4XQSocArFsYRFt6qIzX48UOXLgTDrvca+ZVYGQ=`
- [ ] Check execution history for errors

---

## Common Issues & Solutions

### Issue 1: "Emails scheduled for future"

**Symptom:** Pending emails but `scheduled_for` is in the future

**Solution:** Wait until the scheduled time arrives. The system schedules emails throughout the day (9am-5pm) to avoid spam filters.

**Check:**
```sql
SELECT 
  MIN(scheduled_for) as first_email,
  MAX(scheduled_for) as last_email,
  COUNT(*) as total_pending
FROM cold_outreach_email_queue
WHERE status = 'pending';
```

---

### Issue 2: "No OAuth tokens found"

**Symptom:** Error: "No OAuth tokens found for user"

**Solution:** User needs to re-authenticate

**Steps:**
1. Sign out
2. Sign in again with Google or Microsoft
3. Grant permissions for email sending
4. Check tokens are stored (SQL query above)

---

### Issue 3: "CRON_SECRET not set in production"

**Symptom:** Cron job returns 401 Unauthorized

**Solution:** Add CRON_SECRET to production environment

**DigitalOcean:**
1. Go to App → Settings → Environment Variables
2. Add: `CRON_SECRET=BwhRI4XQSocArFsYRFt6qIzX48UOXLgTDrvca+ZVYGQ=`
3. Redeploy app

**Vercel:**
1. Project Settings → Environment Variables
2. Add: `CRON_SECRET=BwhRI4XQSocArFsYRFt6qIzX48UOXLgTDrvca+ZVYGQ=`
3. Redeploy

---

### Issue 4: "Cron job not running"

**Symptom:** Manual curl works, but emails never send automatically

**Solution:** Verify cron job is enabled and running

**Check:**
1. Go to cron-job.org dashboard
2. Check "Last Execution" timestamp
3. Check "Status" (should be green/success)
4. Check execution logs for errors

---

### Issue 5: "Token expired"

**Symptom:** Emails fail with token expiration error

**Solution:** System should auto-refresh, but user may need to re-authenticate

**Check logs:**
```sql
SELECT * FROM cold_outreach_email_log
WHERE event_type = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

**Fix:** User signs out and signs in again

---

## Step-by-Step Debugging

### Step 1: Verify Campaign Setup

```sql
-- Check campaign status
SELECT 
  id,
  name,
  status,
  created_at,
  updated_at
FROM cold_outreach_campaigns
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;
```

Campaign should be `status = 'active'`

---

### Step 2: Verify Emails Are Queued

```sql
-- Count emails by status
SELECT 
  status,
  COUNT(*) as count
FROM cold_outreach_email_queue
WHERE campaign_id = 'YOUR_CAMPAIGN_ID'
GROUP BY status;
```

Should see emails in `pending` status

---

### Step 3: Check Scheduled Times

```sql
-- Check when emails are scheduled
SELECT 
  scheduled_for,
  COUNT(*) as emails_at_this_time
FROM cold_outreach_email_queue
WHERE campaign_id = 'YOUR_CAMPAIGN_ID'
  AND status = 'pending'
GROUP BY scheduled_for
ORDER BY scheduled_for ASC
LIMIT 10;
```

If all times are in the future, wait for scheduled time

---

### Step 4: Force Send One Email (Testing)

```sql
-- Update one email to send immediately
UPDATE cold_outreach_email_queue
SET scheduled_for = NOW() - INTERVAL '1 minute'
WHERE id = (
  SELECT id 
  FROM cold_outreach_email_queue 
  WHERE status = 'pending' 
  LIMIT 1
)
RETURNING id, scheduled_for;
```

Then manually trigger cron:
```bash
curl -X POST https://YOUR-DOMAIN.com/api/email-automation/send-batch \
  -H "Authorization: Bearer BwhRI4XQSocArFsYRFt6qIzX48UOXLgTDrvca+ZVYGQ="
```

---

### Step 5: Check Email Logs

```sql
-- Check recent email activity
SELECT 
  event_type,
  message,
  metadata,
  created_at
FROM cold_outreach_email_log
WHERE campaign_id = 'YOUR_CAMPAIGN_ID'
ORDER BY created_at DESC
LIMIT 20;
```

Look for errors or "sent" events

---

## Quick Fix Script

Run this to check everything at once:

```sql
-- COMPREHENSIVE DIAGNOSTIC
WITH user_info AS (
  SELECT id, email FROM cold_outreach_user_profiles LIMIT 1
),
token_info AS (
  SELECT user_id, provider, expires_at 
  FROM cold_outreach_oauth_tokens 
  WHERE user_id = (SELECT id FROM user_info)
),
campaign_info AS (
  SELECT id, name, status 
  FROM cold_outreach_campaigns 
  WHERE user_id = (SELECT id FROM user_info)
  ORDER BY created_at DESC 
  LIMIT 1
),
queue_stats AS (
  SELECT 
    status,
    COUNT(*) as count,
    MIN(scheduled_for) as earliest,
    MAX(scheduled_for) as latest
  FROM cold_outreach_email_queue
  WHERE campaign_id = (SELECT id FROM campaign_info)
  GROUP BY status
)
SELECT 
  'User' as check_type,
  (SELECT email FROM user_info) as value
UNION ALL
SELECT 
  'OAuth Provider',
  (SELECT provider FROM token_info)
UNION ALL
SELECT 
  'Token Expires',
  (SELECT expires_at::text FROM token_info)
UNION ALL
SELECT 
  'Campaign Status',
  (SELECT status FROM campaign_info)
UNION ALL
SELECT 
  'Pending Emails',
  (SELECT count::text FROM queue_stats WHERE status = 'pending')
UNION ALL
SELECT 
  'Earliest Send Time',
  (SELECT earliest::text FROM queue_stats WHERE status = 'pending')
UNION ALL
SELECT 
  'Current Time',
  NOW()::text;
```

---

## What to Send Me for Help

If still stuck, provide:

1. **Database query results:**
   - Pending emails count
   - Scheduled times (earliest and latest)
   - OAuth token status

2. **Cron job info:**
   - Is it enabled?
   - Last execution time
   - Any error messages

3. **Manual curl test result:**
   - Full response from send-batch endpoint

4. **Production URL:**
   - Where is the app deployed?

---

## Most Likely Issues

Based on "pending but not sending":

1. **Scheduled for future** (80% of cases)
   - Emails are scheduled throughout the day
   - Check `scheduled_for` times
   - Wait or force update one email to test

2. **Cron job not running** (15% of cases)
   - Not configured on cron-job.org
   - Wrong URL or secret
   - Not enabled

3. **Missing OAuth tokens** (5% of cases)
   - User needs to re-authenticate
   - Tokens expired
