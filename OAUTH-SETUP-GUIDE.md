# OAuth Setup Guide - Fix Google & Microsoft Login

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Your Workspace URL

Navigate to this page in your browser:
```
/oauth-setup
```

This page will show you:
- ✅ Your current workspace URL
- ✅ The exact callback URLs you need
- ✅ Copy buttons for easy setup

### Step 2: Update .env File

**Option A: Use the OAuth Setup Page**
1. Go to `/oauth-setup`
2. Click "Copy .env Line"
3. Open `.env` file
4. Replace the `NEXTAUTH_URL=` line with the copied text

**Option B: Use the Script**
```bash
# Get your URL from /oauth-setup page, then run:
./fix-oauth-url.sh https://YOUR-WORKSPACE-URL-HERE
```

### Step 3: Configure Google OAuth

1. **Go to Google Cloud Console:**
   - URL: https://console.cloud.google.com/apis/credentials
   - Sign in with your Google account

2. **Select Your Project:**
   - If you don't have a project, create one
   - Click on the project dropdown at the top

3. **Find Your OAuth 2.0 Client:**
   - Look for "OAuth 2.0 Client IDs" section
   - Click on your client ID (or create one if needed)

4. **Add Redirect URI:**
   - Scroll to "Authorized redirect URIs"
   - Click "+ ADD URI"
   - Paste: `https://YOUR-WORKSPACE-URL/api/auth/callback/google`
   - Click "SAVE"

**Example:**
```
https://3000--019a02f5-6922-73b9-a0ce-9e951dc56da2.gitpod.io/api/auth/callback/google
```

### Step 4: Configure Microsoft OAuth

1. **Go to Azure Portal:**
   - URL: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
   - Sign in with your Microsoft account

2. **Select Your App Registration:**
   - Find your app in the list
   - Click on it to open

3. **Go to Authentication:**
   - Click "Authentication" in the left sidebar
   - Scroll to "Platform configurations"

4. **Add Redirect URI:**
   - Under "Web" platform, click "Add URI"
   - Paste: `https://YOUR-WORKSPACE-URL/api/auth/callback/azure-ad`
   - Click "Save" at the top

**Example:**
```
https://3000--019a02f5-6922-73b9-a0ce-9e951dc56da2.gitpod.io/api/auth/callback/azure-ad
```

### Step 5: Restart Dev Server

```bash
# Stop the current server (Ctrl+C in terminal)
npm run dev
```

### Step 6: Test Login

1. Go to `/login`
2. Click "Continue with Google" or "Continue with Microsoft"
3. You should now be able to log in! ✅

---

## 🔍 Troubleshooting

### Still Getting "redirect_uri_mismatch"?

**Check these things:**

1. **URLs must match exactly:**
   - `.env` file: `NEXTAUTH_URL=https://...`
   - Google Console: `https://.../api/auth/callback/google`
   - Azure Portal: `https://.../api/auth/callback/azure-ad`

2. **No trailing slashes:**
   - ❌ `https://example.com/`
   - ✅ `https://example.com`

3. **Protocol must be https:**
   - ❌ `http://...`
   - ✅ `https://...`

4. **Port must be included:**
   - ❌ `https://workspace.gitpod.io`
   - ✅ `https://3000--workspace.gitpod.io`

### OAuth Providers Not Saving?

- Make sure you clicked "SAVE" in Google Console
- Make sure you clicked "Save" at the top in Azure Portal
- Wait 1-2 minutes for changes to propagate

### Dev Server Not Picking Up Changes?

```bash
# Completely restart:
pkill -f "next dev"
rm -rf .next
npm run dev
```

---

## 📋 Current Configuration

Your current OAuth credentials are stored in your `.env` file.

**Google:**
- Client ID: `YOUR_GOOGLE_CLIENT_ID`
- Client Secret: `YOUR_GOOGLE_CLIENT_SECRET`

**Microsoft:**
- Client ID: `YOUR_MICROSOFT_CLIENT_ID`
- Client Secret: `YOUR_MICROSOFT_CLIENT_SECRET`
- Tenant ID: `common` (or your specific tenant ID)

---

## 🎯 Quick Reference

### Google Cloud Console
- **URL:** https://console.cloud.google.com/apis/credentials
- **What to add:** Authorized redirect URI
- **Format:** `https://YOUR-URL/api/auth/callback/google`

### Azure Portal
- **URL:** https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
- **What to add:** Redirect URI (Web platform)
- **Format:** `https://YOUR-URL/api/auth/callback/azure-ad`

### Files to Update
- `.env` - Update `NEXTAUTH_URL=`
- Google Console - Add redirect URI
- Azure Portal - Add redirect URI

---

## 💡 Pro Tips

1. **Use the /oauth-setup page** - It shows you exactly what to copy/paste
2. **Bookmark the OAuth setup page** - You'll need it when your workspace URL changes
3. **Keep a backup of .env** - The script creates `.env.backup` automatically
4. **Test both providers** - Make sure Google AND Microsoft login work

---

## 🆘 Still Need Help?

If you're still having issues:

1. Check the browser console for detailed error messages
2. Check the terminal/server logs for backend errors
3. Verify your OAuth credentials are correct in `.env`
4. Make sure your Google/Microsoft accounts have the necessary permissions

---

## ✅ Success Checklist

- [ ] Navigated to `/oauth-setup`
- [ ] Copied workspace URL
- [ ] Updated `.env` file with new `NEXTAUTH_URL`
- [ ] Added redirect URI to Google Cloud Console
- [ ] Added redirect URI to Azure Portal
- [ ] Restarted dev server
- [ ] Tested Google login - works! ✅
- [ ] Tested Microsoft login - works! ✅
