# DigitalOcean OAuth Setup Guide

Your app is deployed at: `https://sway-pr-leads-g4bfk.ondigitalocean.app/`

## Required Redirect URIs

You need to add these redirect URIs to both Google and Microsoft OAuth apps:

### NextAuth Callback
```
https://sway-pr-leads-g4bfk.ondigitalocean.app/api/auth/callback/google
https://sway-pr-leads-g4bfk.ondigitalocean.app/api/auth/callback/microsoft
```

---

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:
   ```
   https://sway-pr-leads-g4bfk.ondigitalocean.app/api/auth/callback/google
   ```
6. Click **Save**

---

## Microsoft Azure Portal Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Select your app
4. Click **Authentication** in the left sidebar
5. Under **Platform configurations** → **Web**, add redirect URI:
   ```
   https://sway-pr-leads-g4bfk.ondigitalocean.app/api/auth/callback/microsoft
   ```
6. Click **Save**

---

## Update Environment Variables

Make sure your DigitalOcean app has these environment variables set correctly:

### Required Variables
```bash
NEXTAUTH_URL=https://sway-pr-leads-g4bfk.ondigitalocean.app
PUBLIC_BASE_URL=https://sway-pr-leads-g4bfk.ondigitalocean.app
APP_BASE_URL=https://sway-pr-leads-g4bfk.ondigitalocean.app

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=your_tenant_id
```

---

## Verification Steps

After updating the redirect URIs:

1. Wait 5-10 minutes for changes to propagate
2. Try logging in with Google: `https://sway-pr-leads-g4bfk.ondigitalocean.app/login`
3. Try logging in with Microsoft: `https://sway-pr-leads-g4bfk.ondigitalocean.app/login`

---

## Troubleshooting

### "redirect_uri_mismatch" Error
- Double-check the redirect URI is exactly: `https://sway-pr-leads-g4bfk.ondigitalocean.app/api/auth/callback/google`
- No trailing slashes
- Must use `https://` (not `http://`)
- Must match exactly (case-sensitive)

### "invalid_request" Error (Microsoft)
- Verify the redirect URI in Azure Portal matches exactly
- Check that the app is not using the wrong tenant ID
- Ensure the app has proper API permissions

### Still Not Working?
1. Clear browser cache and cookies
2. Try in incognito/private browsing mode
3. Check DigitalOcean app logs for errors
4. Verify all environment variables are set in DigitalOcean

---

## Quick Reference

**Your App URL:** `https://sway-pr-leads-g4bfk.ondigitalocean.app/`

**Google Redirect URI:**
```
https://sway-pr-leads-g4bfk.ondigitalocean.app/api/auth/callback/google
```

**Microsoft Redirect URI:**
```
https://sway-pr-leads-g4bfk.ondigitalocean.app/api/auth/callback/microsoft
```
