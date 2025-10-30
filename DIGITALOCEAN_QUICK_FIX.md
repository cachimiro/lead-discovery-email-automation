# Quick Fix for OAuth Errors

## The Problem
You're getting OAuth errors because the redirect URIs in Google and Microsoft don't match your DigitalOcean URL.

## The Solution (5 minutes)

### Step 1: Update Google OAuth (2 minutes)

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", click **+ ADD URI**
4. Paste this EXACT URL:
   ```
   https://sway-pr-leads-g4bfk.ondigitalocean.app/api/auth/callback/google
   ```
5. Click **SAVE**

### Step 2: Update Microsoft OAuth (2 minutes)

1. Go to: https://portal.azure.com/
2. Search for "App registrations" and select your app
3. Click **Authentication** in the left menu
4. Under "Web" → "Redirect URIs", click **Add URI**
5. Paste this EXACT URL (note: it's `azure-ad` not `microsoft`):
   ```
   https://sway-pr-leads-g4bfk.ondigitalocean.app/api/auth/callback/azure-ad
   ```
6. Make sure **"ID tokens"** is checked under "Implicit grant and hybrid flows"
7. Click **Save**

### Step 3: Verify Environment Variables in DigitalOcean (1 minute)

1. Go to your DigitalOcean App Platform dashboard
2. Click on your app → **Settings** → **App-Level Environment Variables**
3. Make sure these are set:
   ```
   NEXTAUTH_URL=https://sway-pr-leads-g4bfk.ondigitalocean.app
   PUBLIC_BASE_URL=https://sway-pr-leads-g4bfk.ondigitalocean.app
   APP_BASE_URL=https://sway-pr-leads-g4bfk.ondigitalocean.app
   ```

### Step 4: Test (30 seconds)

1. Wait 2-3 minutes for changes to propagate
2. Go to: https://sway-pr-leads-g4bfk.ondigitalocean.app/login
3. Try logging in with Google or Microsoft

---

## Common Mistakes to Avoid

❌ **Wrong:** `https://sway-pr-leads-g4bfk.ondigitalocean.app/api/auth/callback/google/`  
✅ **Right:** `https://sway-pr-leads-g4bfk.ondigitalocean.app/api/auth/callback/google`

- No trailing slash
- Must be HTTPS (not HTTP)
- Must match exactly (case-sensitive)

---

## Still Not Working?

1. **Clear your browser cache** or try incognito mode
2. **Check the exact error message** - it will tell you what redirect URI it's expecting
3. **Verify the client IDs** in your DigitalOcean environment variables match the ones in Google/Microsoft consoles
4. **Wait a few minutes** - OAuth changes can take time to propagate

---

## Need Help?

Check the logs in DigitalOcean:
1. Go to your app dashboard
2. Click **Runtime Logs**
3. Look for any errors related to OAuth or NextAuth
