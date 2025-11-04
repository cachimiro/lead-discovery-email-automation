# Cron Job Setup - Email Automation

## ✅ How It Works

### Email Sending Flow:
1. **User signs in** with Google or Microsoft OAuth
2. **OAuth tokens are stored** in `cold_outreach_oauth_tokens` table
3. **User's email is stored** in `cold_outreach_user_profiles` table
4. **Campaign is created** and emails are queued
5. **Cron job triggers** every 5 minutes
6. **System sends emails** using the **authenticated user's email account**

### Key Points:
- ✅ Emails are sent **FROM the signed-in user's email** (Google or Microsoft)
- ✅ Uses OAuth tokens to send via Gmail API or Microsoft Graph API
- ✅ No SendGrid or third-party email service needed
- ✅ Emails appear in the user's "Sent" folder
- ✅ Replies come back to the user's email

---

## 🔧 Cron Job Configuration

### Your Cron Secret:
```
BwhRI4XQSocArFsYRFt6qIzX48UOXLgTDrvca+ZVYGQ=
```

### Endpoint to Call:
```
POST https://YOUR-DOMAIN.com/api/email-automation/send-batch
```

### Required Header:
```
Authorization: Bearer BwhRI4XQSocArFsYRFt6qIzX48UOXLgTDrvca+ZVYGQ=
```

---

## 📋 Setup Instructions for cron-job.org

1. **Go to** [https://cron-job.org](https://cron-job.org)

2. **Create Account** (if you haven't already)

3. **Create New Cron Job:**
   - **Title:** Lead Discovery Email Sender
   - **URL:** `https://YOUR-DOMAIN.com/api/email-automation/send-batch`
   - **Schedule:** Every 5 minutes
     - Pattern: `*/5 * * * *`
   - **Request Method:** POST
   - **Request Headers:**
     ```
     Authorization: Bearer BwhRI4XQSocArFsYRFt6qIzX48UOXLgTDrvca+ZVYGQ=
     ```

4. **Save and Enable**

---

## 🧪 Testing the Setup

### Manual Test (Before Setting Up Cron):
```bash
curl -X POST https://YOUR-DOMAIN.com/api/email-automation/send-batch \
  -H "Authorization: Bearer BwhRI4XQSocArFsYRFt6qIzX48UOXLgTDrvca+ZVYGQ="
```

### Expected Response:
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

### If No Emails to Send:
```json
{
  "success": true,
  "message": "No emails to send",
  "processed": 0
}
```

---

## 🔍 Verification Checklist

### Before Emails Can Send:
- [ ] User has signed in with Google or Microsoft
- [ ] OAuth tokens are stored in database
- [ ] Campaign has been created
- [ ] Campaign has been **started** (emails queued)
- [ ] Emails have `status='pending'` in `cold_outreach_email_queue`
- [ ] `scheduled_for` time has passed
- [ ] Cron job is configured and running

### Check Database:
```sql
-- Check if user has OAuth tokens
SELECT * FROM cold_outreach_oauth_tokens WHERE user_id = 'YOUR_USER_ID';

-- Check pending emails
SELECT * FROM cold_outreach_email_queue 
WHERE status = 'pending' 
AND scheduled_for <= NOW()
ORDER BY scheduled_for ASC;

-- Check sent emails
SELECT * FROM cold_outreach_email_queue 
WHERE status = 'sent'
ORDER BY sent_at DESC;
```

---

## 🚨 Troubleshooting

### Emails Not Sending?

1. **Check OAuth Connection:**
   - Go to Settings → Email Connection
   - Verify Google or Microsoft is connected
   - Re-authenticate if needed

2. **Check Email Queue:**
   - Are emails in `pending` status?
   - Is `scheduled_for` in the past?

3. **Check Cron Job:**
   - Is it running every 5 minutes?
   - Check cron-job.org execution logs
   - Verify the Authorization header is correct

4. **Check Server Logs:**
   - Look for errors in the application logs
   - Check for OAuth token expiration errors

5. **Manual Trigger:**
   - Run the curl command above
   - Check the response for errors

---

## 📊 Monitoring

### Cron Job Logs:
- Check cron-job.org dashboard for execution history
- Look for failed requests (should be 200 OK)

### Application Logs:
- Check for "✅ Email sent" messages
- Check for "❌ Failed to send" errors

### Database Monitoring:
```sql
-- Count emails by status
SELECT status, COUNT(*) 
FROM cold_outreach_email_queue 
GROUP BY status;

-- Recent email activity
SELECT * FROM cold_outreach_email_log 
ORDER BY created_at DESC 
LIMIT 20;
```

---

## 🎯 Summary

**YES, this will work and send from whichever email is signed in!**

The system:
1. Stores OAuth tokens when user signs in with Google/Microsoft
2. Uses those tokens to send emails via Gmail API or Microsoft Graph API
3. Emails are sent FROM the authenticated user's email address
4. The cron job just triggers the sending process every 5 minutes
5. All emails appear in the user's Sent folder

**Next Step:** Set up the cron job on cron-job.org with the configuration above.
