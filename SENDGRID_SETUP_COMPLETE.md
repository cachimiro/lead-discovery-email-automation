# SendGrid Email Automation Setup Guide

## Overview

Your email automation system is **ready** but needs SendGrid configuration to send real emails. Currently it's in simulation mode.

## What's Already Built ✅

### 1. Email Sending System
- **Location:** `/api/email-automation/send-batch`
- **Features:**
  - Sends emails via SendGrid
  - Retry logic with exponential backoff
  - Rate limiting (50 emails per batch)
  - Complete error handling
  - Audit logging

### 2. Response Monitoring System
- **Location:** `/api/email-automation/webhook-response`
- **Features:**
  - Receives email replies via SendGrid Inbound Parse
  - Automatically cancels follow-ups when someone replies
  - Thread matching (3 fallback methods)
  - Duplicate prevention
  - Complete audit trail

### 3. Campaign Management
- **Location:** `/api/email-automation/start-campaign`
- **Features:**
  - Schedules emails with delays
  - Supports follow-up sequences
  - Respects user's connected email provider (Google/Microsoft)
  - Atomic operations

---

## SendGrid Setup (Required for Production)

### Step 1: Create SendGrid Account
1. Go to https://sendgrid.com/
2. Sign up for a free account (100 emails/day free)
3. Verify your email address

### Step 2: Verify Sender Email
1. In SendGrid dashboard, go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter your email address (the one you'll send from)
4. Check your email and click the verification link
5. Copy the verified email address

### Step 3: Create API Key
1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it: `Lead Discovery Production`
4. Select **Full Access** (or at minimum: Mail Send + Inbound Parse)
5. Click **Create & View**
6. **Copy the API key** (you won't see it again!)

### Step 4: Set Up Inbound Parse (Response Monitoring)
1. Go to **Settings** → **Inbound Parse**
2. Click **Add Host & URL**
3. Enter:
   - **Subdomain:** `replies` (or any name you want)
   - **Domain:** Your domain (e.g., `yourdomain.com`)
   - **Destination URL:** `https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/webhook-response`
   - Check **POST the raw, full MIME message**
4. Click **Add**

### Step 5: Configure DNS (for Inbound Parse)
Add these DNS records to your domain:

**MX Record:**
```
Type: MX
Host: replies (or your chosen subdomain)
Value: mx.sendgrid.net
Priority: 10
```

**CNAME Record (optional but recommended):**
```
Type: CNAME
Host: replies
Value: mx.sendgrid.net
```

### Step 6: Set Environment Variables in DigitalOcean

Go to your DigitalOcean app → **Settings** → **Environment Variables** and add:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.your-api-key-here
SENDGRID_VERIFIED_SENDER=your-verified-email@domain.com
SENDGRID_WEBHOOK_SECRET=your-webhook-secret-here

# Cron Secret (for scheduled email sending)
CRON_SECRET=generate-a-random-secret-here
```

**Generate CRON_SECRET:**
```bash
openssl rand -base64 32
```

**Generate SENDGRID_WEBHOOK_SECRET:**
```bash
openssl rand -base64 32
```

---

## How It Works

### Email Sending Flow

1. **User creates campaign** → Selects leads and email template
2. **Campaign starts** → Emails are scheduled in the queue
3. **Cron job runs** (every 5 minutes) → Sends pending emails
4. **SendGrid sends** → Tracks opens, clicks, bounces
5. **Logs everything** → Complete audit trail

### Response Monitoring Flow

1. **Lead replies** → Email goes to `replies@yourdomain.com`
2. **SendGrid forwards** → Webhook to your app
3. **App processes** → Matches reply to original email
4. **Auto-cancels** → All follow-ups for that lead
5. **Logs response** → Saved in database

---

## Setting Up Cron Job (Required)

Your email sending requires a cron job to run every 5 minutes.

### Option 1: DigitalOcean App Platform Cron (Recommended)

Add to your `app.yaml` or configure in dashboard:

```yaml
jobs:
  - name: email-sender
    kind: CRON
    schedule: "*/5 * * * *"  # Every 5 minutes
    run_command: |
      curl -X POST https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/send-batch \
        -H "Authorization: Bearer ${CRON_SECRET}"
```

### Option 2: External Cron Service

Use a service like:
- **Cron-job.org** (free)
- **EasyCron** (free tier)
- **UptimeRobot** (free, 5-minute intervals)

Configure:
- **URL:** `https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/send-batch`
- **Method:** POST
- **Headers:** `Authorization: Bearer YOUR_CRON_SECRET`
- **Interval:** Every 5 minutes

---

## Testing the System

### 1. Test Email Sending (Manual)

```bash
# Send a test batch
curl -X POST https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/send-batch \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 2. Test Response Webhook

Send an email to `replies@yourdomain.com` and check:
- DigitalOcean logs for webhook processing
- Database for response record
- Follow-ups should be cancelled

### 3. Check System Health

```bash
# Check email queue status
curl https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/send-batch

# Check webhook status
curl https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/webhook-response
```

---

## Current Status

### ✅ Ready to Use
- Email sending logic (with SendGrid integration)
- Response monitoring webhook
- Follow-up cancellation
- Campaign management
- Error handling and retry logic
- Complete audit logging

### ⚠️ Needs Configuration
- SendGrid API key
- Verified sender email
- Inbound Parse webhook
- DNS records for inbound email
- Cron job setup

### 📝 Currently in Simulation Mode
The system is currently simulating email sends. Once you add the SendGrid API key, it will send real emails.

---

## Security Notes

### Webhook Security
The webhook endpoint verifies SendGrid signatures in production. Make sure to:
1. Set `SENDGRID_WEBHOOK_SECRET` in environment variables
2. Keep it secret and secure
3. Rotate it periodically

### Cron Security
The cron endpoint requires authentication:
1. Set `CRON_SECRET` in environment variables
2. Include it in the `Authorization` header
3. Never expose it publicly

---

## Monitoring

### Check Email Queue
```sql
-- In Supabase SQL Editor
SELECT 
  status,
  COUNT(*) as count
FROM cold_outreach_email_queue
GROUP BY status;
```

### Check Recent Responses
```sql
SELECT 
  from_email,
  subject,
  received_at,
  cancelled_follow_ups,
  follow_ups_cancelled_count
FROM cold_outreach_email_responses
ORDER BY received_at DESC
LIMIT 10;
```

### Check Email Logs
```sql
SELECT 
  event_type,
  message,
  created_at
FROM cold_outreach_email_log
ORDER BY created_at DESC
LIMIT 20;
```

---

## Troubleshooting

### Emails Not Sending
1. Check SendGrid API key is set correctly
2. Verify sender email is verified in SendGrid
3. Check cron job is running
4. Look at DigitalOcean logs for errors
5. Check email queue status

### Responses Not Being Detected
1. Verify Inbound Parse is configured
2. Check DNS records are correct
3. Test webhook endpoint manually
4. Check DigitalOcean logs for webhook calls
5. Verify webhook secret is set

### Follow-ups Not Cancelling
1. Check response was recorded in database
2. Verify `cancel_follow_ups_for_recipient` function exists
3. Check email queue for cancelled status
4. Look at email logs for cancellation events

---

## Next Steps

1. **Set up SendGrid account** (15 minutes)
2. **Configure environment variables** (5 minutes)
3. **Set up cron job** (10 minutes)
4. **Test with a small campaign** (5 minutes)
5. **Monitor and adjust** (ongoing)

---

## Support

If you need help:
1. Check DigitalOcean runtime logs
2. Check Supabase logs
3. Review email logs in database
4. Test endpoints manually with curl

The system is production-ready and bulletproof once SendGrid is configured! 🚀
