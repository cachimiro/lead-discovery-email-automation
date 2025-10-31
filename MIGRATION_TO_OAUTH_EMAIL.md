# Migration to OAuth Email Sending

## Overview

Your system now sends emails directly from authenticated user accounts (Gmail or Microsoft) instead of using SendGrid. This eliminates the need for manual email verification and allows multiple users to send from their own accounts.

## What Changed

### Before (SendGrid)
- ❌ Required manual sender verification
- ❌ Single sender email for all users
- ❌ Additional API costs
- ❌ Complex setup process

### After (OAuth)
- ✅ No manual verification needed
- ✅ Each user sends from their own account
- ✅ No additional costs
- ✅ Automatic token management
- ✅ Better email deliverability

## Migration Steps

### Step 1: Run Database Migration

You need to create the OAuth tokens table in your Supabase database.

**Option A: Via Supabase Dashboard**
1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Copy the contents of `db/migrations/add_oauth_tokens_table.sql`
4. Paste and click **Run**

**Option B: Via Command Line** (if you have database access)
```bash
psql $DATABASE_URL -f db/migrations/add_oauth_tokens_table.sql
```

### Step 2: Update OAuth Provider Settings

#### For Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Library**
4. Search for "Gmail API" and click **Enable**
5. Go to **APIs & Services** > **OAuth consent screen**
6. Verify the scope `https://www.googleapis.com/auth/gmail.send` is listed
7. If not, you may need to re-publish your consent screen

#### For Microsoft OAuth

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Select your application
4. Go to **API permissions**
5. Click **Add a permission**
6. Select **Microsoft Graph** > **Delegated permissions**
7. Search for and add `Mail.Send`
8. Click **Grant admin consent for [Your Organization]**

### Step 3: Update Environment Variables

The OAuth scopes are now configured in the code, but verify your OAuth credentials are set:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=your_microsoft_tenant_id

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=your_app_url
```

You can **remove** these if they exist (no longer needed):
```env
SENDGRID_API_KEY=...
SENDGRID_VERIFIED_SENDER=...
```

### Step 4: Restart Your Application

```bash
npm run dev
```

### Step 5: Re-authenticate Users

**Important**: All existing users must sign out and sign back in to grant the new email sending permissions.

1. Users click **Sign Out**
2. Users click **Sign In** with Google or Microsoft
3. Users will see a new permission request for email sending
4. Users click **Allow** or **Accept**
5. OAuth tokens are automatically stored

### Step 6: Verify Setup

Run the test script to verify everything is configured correctly:

```bash
npm run test:oauth-email
```

Expected output:
```
🧪 Testing OAuth Email Sending

1. Checking OAuth tokens table...
✅ OAuth tokens table exists

2. Checking for users with OAuth tokens...
✅ Found 1 OAuth token(s):
   - User: xxx-xxx-xxx, Provider: google, Created: 2024-...

3. Checking for pending emails...
ℹ️  No pending emails in queue.

✅ OAuth email system is ready!
```

## Testing Email Sending

### Create a Test Campaign

1. Log in to your application
2. Go to **Email Campaigns**
3. Create a new campaign
4. Add test recipients
5. Schedule or send immediately
6. Check the email queue and logs

### Monitor Logs

Check email sending logs in Supabase:

```sql
-- View recent email sends
SELECT * FROM cold_outreach_email_log 
WHERE event_type = 'sent' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check for errors
SELECT * FROM cold_outreach_email_log 
WHERE event_type = 'error' 
ORDER BY created_at DESC 
LIMIT 10;
```

## Troubleshooting

### Issue: "No OAuth tokens found for user"

**Cause**: User hasn't authenticated with the new permissions.

**Solution**: 
1. User signs out
2. User signs back in
3. User approves email sending permission

### Issue: Gmail API returns 403 Forbidden

**Cause**: Gmail API not enabled or insufficient permissions.

**Solution**:
1. Enable Gmail API in Google Cloud Console
2. Verify OAuth scope includes `https://www.googleapis.com/auth/gmail.send`
3. User re-authenticates

### Issue: Microsoft Graph returns 403 Forbidden

**Cause**: Mail.Send permission not granted.

**Solution**:
1. Add `Mail.Send` permission in Azure Portal
2. Grant admin consent
3. User re-authenticates

### Issue: Token expired errors

**Cause**: Access token expired and refresh failed.

**Solution**:
1. Check that refresh tokens are being stored
2. Verify OAuth is configured with `access_type: "offline"` (already set for Google)
3. User may need to re-authenticate

### Issue: Emails not sending

**Cause**: Multiple possible causes.

**Solution**:
1. Check email queue status:
   ```sql
   SELECT status, COUNT(*) FROM cold_outreach_email_queue GROUP BY status;
   ```
2. Check email logs for errors:
   ```sql
   SELECT * FROM cold_outreach_email_log WHERE event_type = 'error' ORDER BY created_at DESC LIMIT 5;
   ```
3. Verify OAuth tokens exist:
   ```sql
   SELECT user_id, provider FROM cold_outreach_oauth_tokens;
   ```
4. Run the test script: `npm run test:oauth-email`

## Rollback (If Needed)

If you need to rollback to SendGrid:

1. Revert the changes in `lib/auth-config.ts` (remove email scopes)
2. Revert the changes in `app/api/email-automation/send-batch/route.ts`
3. Install SendGrid: `npm install @sendgrid/mail`
4. Set up SendGrid API key and verified sender
5. Restart the application

However, OAuth email sending is recommended for better deliverability and multi-user support.

## Benefits Summary

✅ **No Manual Verification**: Users authenticate once, no domain verification needed  
✅ **Multi-User Support**: Each user sends from their own email account  
✅ **Better Deliverability**: Emails come from legitimate, authenticated accounts  
✅ **Cost Savings**: No SendGrid subscription needed  
✅ **Automatic Token Management**: Tokens refresh automatically  
✅ **User Control**: Users can revoke access anytime via their account settings  
✅ **Compliance**: Emails sent from user's own account, better for compliance  

## Support

For detailed technical documentation, see:
- `OAUTH_EMAIL_SETUP.md` - Complete setup guide
- `lib/email-automation/oauth-email-sender.ts` - Implementation details
- `db/migrations/add_oauth_tokens_table.sql` - Database schema

## Next Steps

1. ✅ Run database migration
2. ✅ Update OAuth provider settings
3. ✅ Restart application
4. ✅ Have users re-authenticate
5. ✅ Test email sending
6. ✅ Monitor logs for any issues

Your email automation system is now ready to send emails directly from user accounts! 🚀
