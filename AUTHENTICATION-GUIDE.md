# Authentication Guide

## Quick Start: Use Dev Login (Recommended for Development)

### Option 1: From Login Page
1. Go to `/login`
2. Click the **"🔧 Development Login (Skip OAuth)"** button
3. Click **"Login as Dev User"**
4. You're logged in! ✅

### Option 2: Direct URL
1. Navigate directly to `/dev-login`
2. Click **"Login as Dev User"**
3. You're logged in! ✅

This creates a dev session that works for all API calls without needing OAuth configuration.

---

## Fixing OAuth (If You Need It)

The OAuth error `redirect_uri_mismatch` happens because the `NEXTAUTH_URL` in `.env` doesn't match your current workspace URL.

### Steps to Fix:

1. **Copy your current browser URL** (the full URL from your address bar)
   - Example: `https://3000--019a02f5-6922-73b9-a0ce-9e951dc56da2.gitpod.io`

2. **Update the .env file:**
   ```bash
   # Run this command with YOUR actual URL
   ./fix-oauth-url.sh https://YOUR-ACTUAL-URL-HERE
   ```

3. **Update Google Cloud Console:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Find your OAuth 2.0 Client ID
   - Add this to "Authorized redirect URIs":
     ```
     https://YOUR-ACTUAL-URL-HERE/api/auth/callback/google
     ```

4. **Update Azure AD (if using Microsoft login):**
   - Go to Azure Portal → App Registrations
   - Add redirect URI:
     ```
     https://YOUR-ACTUAL-URL-HERE/api/auth/callback/azure-ad
     ```

5. **Restart the dev server:**
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

---

## Current Configuration

**Dev User Credentials:**
- Email: `dev@test.com`
- Name: `Dev User`
- ID: `00000000-0000-0000-0000-000000000001`

**OAuth Providers:**
- Google OAuth (requires redirect URI fix)
- Microsoft Azure AD (requires redirect URI fix)

---

## Troubleshooting

### Still getting 401 errors?
- Make sure you're logged in (use `/dev-login`)
- Check browser console for cookie issues
- Try clearing cookies and logging in again

### OAuth still not working?
- Use dev-login instead - it's faster and easier for development
- OAuth is only needed for production deployment

### Need to logout?
- Clear your browser cookies
- Or navigate to `/api/auth/signout`
