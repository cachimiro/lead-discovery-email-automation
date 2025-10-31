# Quick Setup - 30 Minutes to Production

## Step 1: Database Schema (2 minutes)

Run in Supabase SQL Editor:

```sql
-- File: db/AI_RESPONSE_ANALYSIS_SCHEMA.sql
-- Copy and paste the entire file
```

## Step 2: Add Environment Variables (5 minutes)

Go to DigitalOcean → Your App → Settings → Environment Variables

Add these:

```bash
# SendGrid
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_VERIFIED_SENDER=your-email@domain.com
SENDGRID_WEBHOOK_SECRET=generate-random-32-char-string

# OpenAI
OPENAI_API_KEY=your-openai-key

# Cron
CRON_SECRET=generate-random-32-char-string
```

**Generate secrets:**
```bash
openssl rand -base64 32
```

## Step 3: SendGrid Setup (15 minutes)

### A. Create Account
1. Go to https://sendgrid.com/
2. Sign up (free tier: 100 emails/day)

### B. Verify Sender
1. Settings → Sender Authentication
2. Verify a Single Sender
3. Enter your email
4. Click verification link in email

### C. Create API Key
1. Settings → API Keys
2. Create API Key
3. Name: "Lead Discovery"
4. Full Access
5. Copy the key (starts with `SG.`)

### D. Inbound Parse (for response monitoring)
1. Settings → Inbound Parse
2. Add Host & URL
3. Subdomain: `replies`
4. URL: `https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/webhook-response`
5. Check "POST raw MIME"

### E. DNS Records
Add to your domain:

```
Type: MX
Host: replies
Value: mx.sendgrid.net
Priority: 10
```

## Step 4: OpenAI API Key (3 minutes)

1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy the key (starts with `sk-`)
4. Add to DigitalOcean environment variables

## Step 5: Cron Job (10 minutes)

### Option A: DigitalOcean Cron (Recommended)

Add to your app configuration:

```yaml
jobs:
  - name: email-sender
    kind: CRON
    schedule: "*/5 * * * *"
    run_command: |
      curl -X POST https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/send-batch \
        -H "Authorization: Bearer ${CRON_SECRET}"
```

### Option B: External Service

Use Cron-job.org (free):
1. Sign up at https://cron-job.org/
2. Create new cron job
3. URL: `https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/send-batch`
4. Method: POST
5. Headers: `Authorization: Bearer YOUR_CRON_SECRET`
6. Schedule: Every 5 minutes

## Step 6: Test (5 minutes)

### Test Email Sending

```bash
curl -X POST https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/send-batch \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test AI Response Analysis

```bash
curl "https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/responses"
```

### Check System Health

```bash
curl https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/send-batch
```

## Done! 🎉

Your system is now:
- ✅ Sending emails (28/day max)
- ✅ Monitoring responses
- ✅ Analyzing with AI
- ✅ Cancelling follow-ups automatically

## Next Steps

1. Create a test campaign with 5-10 contacts
2. Monitor for 24 hours
3. Check AI analysis results
4. Scale up gradually

## Need Help?

- **SendGrid:** `SENDGRID_SETUP_COMPLETE.md`
- **AI Analysis:** `AI_RESPONSE_ANALYSIS_GUIDE.md`
- **Testing:** `EMAIL_AUTOMATION_TEST_GUIDE.md`
- **Full Overview:** `FINAL_SYSTEM_SUMMARY.md`
