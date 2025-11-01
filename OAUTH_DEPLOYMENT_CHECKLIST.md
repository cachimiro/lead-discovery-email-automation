# OAuth Email Deployment Checklist

## ✅ Code Pushed to GitHub

Your OAuth email implementation has been pushed to the main branch and will be deployed to Digital Ocean automatically.

**Commit**: `09ec631 - Implement OAuth-based email sending for Gmail and Microsoft`

## 🔧 Post-Deployment Steps

### 1. Run Database Migration in Supabase

Once the app is deployed, run this SQL in your Supabase SQL Editor:

```sql
-- Create table for storing OAuth tokens
CREATE TABLE IF NOT EXISTS cold_outreach_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES cold_outreach_user_profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON cold_outreach_oauth_tokens(user_id);

-- Add RLS policies
ALTER TABLE cold_outreach_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only read their own tokens
CREATE POLICY "Users can read own tokens"
  ON cold_outreach_oauth_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all tokens
CREATE POLICY "Service role can manage tokens"
  ON cold_outreach_oauth_tokens
  FOR ALL
  USING (true);

COMMENT ON TABLE cold_outreach_oauth_tokens IS 'Stores OAuth access and refresh tokens for sending emails from user accounts';
```

### 2. Update Google OAuth Configuration

In [Google Cloud Console](https://console.cloud.google.com/):

1. Go to **APIs & Services** > **Library**
2. Search for "Gmail API"
3. Click **Enable**
4. Go to **APIs & Services** > **OAuth consent screen**
5. Verify the scope `https://www.googleapis.com/auth/gmail.send` is included
6. If you need to add it:
   - Click **Edit App**
   - Go to **Scopes**
   - Click **Add or Remove Scopes**
   - Search for "Gmail API" and select `gmail.send`
   - Click **Update** and **Save and Continue**

### 3. Update Microsoft OAuth Configuration

In [Azure Portal](https://portal.azure.com/):

1. Go to **Azure Active Directory** > **App registrations**
2. Select your application
3. Go to **API permissions**
4. Click **Add a permission**
5. Select **Microsoft Graph** > **Delegated permissions**
6. Search for and check `Mail.Send`
7. Click **Add permissions**
8. Click **Grant admin consent for [Your Organization]** (if you have admin rights)

### 4. Verify Digital Ocean Deployment

Check that your app deployed successfully:

1. Go to [Digital Ocean App Platform](https://cloud.digitalocean.com/apps)
2. Find your app
3. Check the **Activity** tab for deployment status
4. Look for: "Deployment successful"
5. Click on your app URL to verify it's running

### 5. Test OAuth Email Sending

Once deployed and migrations are run:

1. **Sign Out** of your application (if logged in)
2. **Sign In** with Google or Microsoft
3. **Approve** the new email sending permission when prompted
4. **Create a test campaign** with a test email
5. **Check email logs** in Supabase:

```sql
SELECT * FROM cold_outreach_email_log 
WHERE event_type = 'sent' 
ORDER BY created_at DESC 
LIMIT 5;
```

6. **Verify OAuth tokens** are stored:

```sql
SELECT user_id, provider, created_at 
FROM cold_outreach_oauth_tokens;
```

### 6. Monitor for Issues

Check for any errors in the logs:

**In Digital Ocean:**
- Go to your app
- Click **Runtime Logs**
- Look for any OAuth-related errors

**In Supabase:**
```sql
SELECT * FROM cold_outreach_email_log 
WHERE event_type = 'error' 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🚨 Important Notes

### For Existing Users
All existing users MUST sign out and sign back in to grant the new email sending permissions. Without this, they won't be able to send emails.

### OAuth Consent Screen
If your Google OAuth app is in "Testing" mode, you'll need to add test users or publish the app for production use.

### Microsoft Admin Consent
If you don't have admin rights in Azure, you may need to request admin consent from your organization's admin.

## 📋 Verification Checklist

- [ ] Code pushed to GitHub (main branch)
- [ ] Digital Ocean deployment successful
- [ ] Database migration run in Supabase
- [ ] OAuth tokens table created
- [ ] Gmail API enabled in Google Cloud Console
- [ ] Gmail send scope added to OAuth consent screen
- [ ] Mail.Send permission added in Azure Portal
- [ ] Admin consent granted (if required)
- [ ] Signed out and signed back in
- [ ] New email permissions approved
- [ ] OAuth tokens stored in database
- [ ] Test email sent successfully
- [ ] Email appears in sent folder
- [ ] No errors in logs

## 🔍 Troubleshooting

### "No OAuth tokens found for user"
**Solution**: Sign out and sign back in to grant email permissions

### Gmail API 403 Error
**Solution**: 
1. Enable Gmail API in Google Cloud Console
2. Add gmail.send scope to OAuth consent screen
3. Re-authenticate

### Microsoft Graph 403 Error
**Solution**:
1. Add Mail.Send permission in Azure Portal
2. Grant admin consent
3. Re-authenticate

### Deployment Failed
**Solution**:
1. Check Digital Ocean build logs
2. Verify all environment variables are set
3. Check for any build errors

## 📚 Documentation

- **Setup Guide**: `OAUTH_EMAIL_SETUP.md`
- **Migration Guide**: `MIGRATION_TO_OAUTH_EMAIL.md`
- **Implementation Details**: `OAUTH_EMAIL_COMPLETE.md`

## 🎉 Success Indicators

You'll know everything is working when:

✅ Users can sign in with Google/Microsoft  
✅ OAuth tokens appear in database  
✅ Email campaigns can be created  
✅ Emails are sent successfully  
✅ Emails appear in user's sent folder  
✅ No errors in logs  

## 🆘 Need Help?

If you encounter issues:

1. Check the logs in Digital Ocean
2. Check email logs in Supabase
3. Verify OAuth tokens are stored
4. Review the troubleshooting sections in the documentation
5. Ensure all OAuth permissions are granted

---

**Current Status**: ✅ Code deployed to GitHub  
**Next Step**: Wait for Digital Ocean deployment, then run database migration  
**Estimated Time**: 5-10 minutes for deployment + 5 minutes for setup
