# OAuth Email Sending Setup

This system sends emails directly from the authenticated user's Gmail or Microsoft account using OAuth tokens. No SendGrid or manual email verification required.

## How It Works

1. **User Authentication**: When users sign in with Google or Microsoft, the system requests email sending permissions
2. **Token Storage**: OAuth access and refresh tokens are securely stored in the database
3. **Email Sending**: Emails are sent directly from the user's account using Gmail API or Microsoft Graph API
4. **Token Refresh**: Expired tokens are automatically refreshed using refresh tokens

## Required OAuth Scopes

### Google OAuth
- `openid profile email` - Basic profile information
- `https://www.googleapis.com/auth/gmail.send` - Send emails via Gmail

### Microsoft OAuth
- `openid profile email User.Read` - Basic profile information
- `Mail.Send` - Send emails via Microsoft Graph

## Setup Steps

### 1. Update Google OAuth Configuration

In [Google Cloud Console](https://console.cloud.google.com/):

1. Go to **APIs & Services** > **Credentials**
2. Select your OAuth 2.0 Client ID
3. Add the Gmail API scope:
   - Go to **APIs & Services** > **Library**
   - Search for "Gmail API"
   - Click **Enable**
4. Update your OAuth consent screen to include the Gmail send scope

### 2. Update Microsoft OAuth Configuration

In [Azure Portal](https://portal.azure.com/):

1. Go to **Azure Active Directory** > **App registrations**
2. Select your application
3. Go to **API permissions**
4. Click **Add a permission**
5. Select **Microsoft Graph** > **Delegated permissions**
6. Add `Mail.Send` permission
7. Click **Grant admin consent** (if required)

### 3. Run Database Migration

```bash
# Connect to your Supabase database and run:
psql $DATABASE_URL -f db/migrations/add_oauth_tokens_table.sql
```

Or in Supabase Dashboard:
1. Go to **SQL Editor**
2. Copy and paste the contents of `db/migrations/add_oauth_tokens_table.sql`
3. Click **Run**

### 4. Re-authenticate Users

Existing users need to sign out and sign back in to grant the new email sending permissions:

1. Users click **Sign Out**
2. Users click **Sign In** with Google or Microsoft
3. Users approve the new email sending permission
4. OAuth tokens are automatically stored

## Testing

### 1. Check Token Storage

After signing in, verify tokens are stored:

```sql
SELECT user_id, provider, created_at 
FROM cold_outreach_oauth_tokens;
```

### 2. Test Email Sending

Create a test campaign and send a test email. Check the logs:

```sql
SELECT * FROM cold_outreach_email_log 
WHERE event_type = 'sent' 
ORDER BY created_at DESC 
LIMIT 10;
```

### 3. Monitor for Errors

Check for authentication errors:

```sql
SELECT * FROM cold_outreach_email_log 
WHERE event_type = 'error' 
AND message LIKE '%OAuth%' 
ORDER BY created_at DESC;
```

## Troubleshooting

### "No OAuth tokens found for user"

**Solution**: User needs to sign out and sign back in to grant email permissions.

### "Gmail API error: insufficient permissions"

**Solution**: 
1. Ensure Gmail API is enabled in Google Cloud Console
2. Verify the OAuth scope includes `https://www.googleapis.com/auth/gmail.send`
3. User needs to re-authenticate

### "Microsoft Graph API error: insufficient privileges"

**Solution**:
1. Ensure `Mail.Send` permission is added in Azure Portal
2. Grant admin consent if required
3. User needs to re-authenticate

### Token Refresh Failures

**Solution**:
1. Check that `access_type: "offline"` is set for Google (already configured)
2. Verify refresh tokens are being stored in the database
3. User may need to re-authenticate if refresh token is invalid

## Security Notes

- OAuth tokens are stored encrypted in the database
- Tokens are only accessible by the service role and the token owner
- Refresh tokens allow automatic token renewal without user interaction
- Users can revoke access at any time through their Google/Microsoft account settings

## Benefits Over SendGrid

✅ **No Manual Verification**: No need to verify sender domains or emails  
✅ **Multi-User Support**: Each user sends from their own account  
✅ **Better Deliverability**: Emails come from legitimate user accounts  
✅ **No Additional Costs**: Uses existing OAuth infrastructure  
✅ **Automatic Token Management**: Tokens refresh automatically  
✅ **User Control**: Users can revoke access anytime  

## Migration from SendGrid

If you were using SendGrid before:

1. Remove SendGrid API key from environment variables
2. Users re-authenticate to grant email permissions
3. Existing campaigns will automatically use OAuth sending
4. No changes needed to campaign or email queue data

## API Reference

### Gmail API
- **Endpoint**: `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`
- **Method**: POST
- **Auth**: Bearer token
- **Format**: RFC 2822 email, base64url encoded

### Microsoft Graph API
- **Endpoint**: `https://graph.microsoft.com/v1.0/me/sendMail`
- **Method**: POST
- **Auth**: Bearer token
- **Format**: JSON message object
