# 🚀 Quick Start: Fix OAuth Login (Google & Microsoft)

## The Problem
You're seeing: **"Error 400: redirect_uri_mismatch"**

This happens because your workspace URL changed, but the OAuth configuration still points to the old URL.

---

## ✅ The Solution (3 Easy Steps)

### Step 1: Open the OAuth Setup Page
Navigate to this URL in your browser:
```
/oauth-setup
```

This page will:
- ✅ Show your current workspace URL
- ✅ Give you the exact callback URLs
- ✅ Provide copy buttons for everything

### Step 2: Follow the Instructions on That Page
The `/oauth-setup` page has step-by-step instructions with:
- Copy buttons for all URLs
- Direct links to Google Cloud Console
- Direct links to Azure Portal
- Visual guides for each step

### Step 3: Restart Your Dev Server
```bash
# In your terminal:
# 1. Stop the server (Ctrl+C)
# 2. Start it again:
npm run dev
```

---

## 📝 What You'll Need to Update

### 1. Your .env File
```bash
NEXTAUTH_URL=https://YOUR-WORKSPACE-URL
```

### 2. Google Cloud Console
Add this redirect URI:
```
https://YOUR-WORKSPACE-URL/api/auth/callback/google
```

### 3. Azure Portal
Add this redirect URI:
```
https://YOUR-WORKSPACE-URL/api/auth/callback/azure-ad
```

---

## 🎯 Quick Commands

### Update .env automatically:
```bash
./fix-oauth-url.sh https://YOUR-WORKSPACE-URL
```

### Get your workspace URL:
1. Look at your browser address bar
2. Copy everything before the path (e.g., `https://3000--abc123.gitpod.io`)
3. Or go to `/oauth-setup` and it will show you

---

## 📚 Detailed Guides

- **Full Setup Guide:** See `OAUTH-SETUP-GUIDE.md`
- **Authentication Options:** See `AUTHENTICATION-GUIDE.md`

---

## 🆘 Need Help?

1. **Go to `/oauth-setup`** - It has everything you need
2. **Check the error message** - It usually tells you what's wrong
3. **Make sure URLs match exactly** - No trailing slashes, include port number

---

## ✨ After Setup

Once configured, you'll be able to:
- ✅ Login with Google
- ✅ Login with Microsoft
- ✅ Access all features without 401 errors
- ✅ Use the contact management system

---

**Remember:** Every time your Gitpod workspace URL changes, you'll need to update the OAuth configuration again. Bookmark the `/oauth-setup` page for easy access!
