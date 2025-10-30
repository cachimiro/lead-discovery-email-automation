# Microsoft OAuth Redirect URI Fix

## The Problem
Microsoft is rejecting the redirect URI. This is usually because:
1. The URI isn't added correctly in Azure Portal
2. The URI has a typo or extra characters
3. The wrong platform type is configured

## Step-by-Step Fix

### Step 1: Go to Azure Portal
1. Navigate to: https://portal.azure.com/
2. Search for **"App registrations"** in the top search bar
3. Click on your app from the list

### Step 2: Check Authentication Settings
1. Click **"Authentication"** in the left sidebar
2. Look at the **"Platform configurations"** section

### Step 3: Verify Web Platform
You should see a **"Web"** platform. If not, add it:
1. Click **"+ Add a platform"**
2. Select **"Web"**
3. Continue to next step

### Step 4: Add the Redirect URI
Under the **Web** platform section:

1. In the **"Redirect URIs"** field, add this EXACT URL:
   ```
   https://sway-pr-leads-g4bfk.ondigitalocean.app/api/auth/callback/azure-ad
   ```
   
   ⚠️ **IMPORTANT:** Notice it's `/azure-ad` NOT `/microsoft`

2. Make sure there are NO:
   - Trailing slashes
   - Extra spaces
   - HTTP (must be HTTPS)

### Step 5: Configure Tokens (Important!)
Still in the Authentication page, scroll down to **"Implicit grant and hybrid flows"**:

✅ Check these boxes:
- [ ] Access tokens (used for implicit flows)
- [x] ID tokens (used for implicit and hybrid flows)

### Step 6: Save
1. Click **"Save"** at the top
2. Wait for the confirmation message

### Step 7: Verify API Permissions
1. Click **"API permissions"** in the left sidebar
2. Make sure you have these Microsoft Graph permissions:
   - `openid`
   - `profile`
   - `email`
   - `User.Read`

If any are missing:
1. Click **"+ Add a permission"**
2. Select **"Microsoft Graph"**
3. Select **"Delegated permissions"**
4. Add the missing permissions
5. Click **"Add permissions"**
6. Click **"Grant admin consent"** (if you have admin rights)

---

## Common Issues

### Issue 1: Wrong Callback Path
❌ **Wrong:** `/api/auth/callback/microsoft`  
✅ **Right:** `/api/auth/callback/azure-ad`

NextAuth uses `azure-ad` as the provider ID, not `microsoft`.

### Issue 2: Multiple Redirect URIs
If you have multiple URIs listed, make sure the DigitalOcean one is there:
```
https://sway-pr-leads-g4bfk.ondigitalocean.app/api/auth/callback/azure-ad
```

You can have multiple URIs (for localhost, staging, production), but the production one MUST be in the list.

### Issue 3: Wrong Tenant ID
Check your DigitalOcean environment variable:
- If you want **any Microsoft account** to sign in: `MICROSOFT_TENANT_ID=common`
- If you want **only your organization**: `MICROSOFT_TENANT_ID=your-actual-tenant-id`

---

## Testing

1. **Wait 2-3 minutes** after saving changes
2. **Clear browser cache** or use incognito mode
3. Go to: https://sway-pr-leads-g4bfk.ondigitalocean.app/login
4. Click **"Sign in with Microsoft"**

---

## Still Getting Errors?

### Check the Exact Error
The error message will tell you what redirect URI Microsoft is expecting. Compare it to what you have in Azure Portal.

### Verify Environment Variables
In DigitalOcean, check these are set correctly:
```
MICROSOFT_CLIENT_ID=your-client-id-from-azure
MICROSOFT_CLIENT_SECRET=your-client-secret-from-azure
MICROSOFT_TENANT_ID=common
NEXTAUTH_URL=https://sway-pr-leads-g4bfk.ondigitalocean.app
```

### Check Application ID URI
In Azure Portal:
1. Go to **"Expose an API"** in the left sidebar
2. The **Application ID URI** should be set (usually `api://your-client-id`)
3. If it's not set, click **"Set"** and save

---

## Quick Checklist

- [ ] Redirect URI is exactly: `https://sway-pr-leads-g4bfk.ondigitalocean.app/api/auth/callback/azure-ad`
- [ ] Platform type is **Web** (not SPA or Mobile)
- [ ] ID tokens are enabled in Authentication settings
- [ ] API permissions include: openid, profile, email, User.Read
- [ ] Environment variables are correct in DigitalOcean
- [ ] Waited 2-3 minutes after making changes
- [ ] Tested in incognito mode

---

## Screenshot Locations

If you need to share screenshots for debugging:

1. **Authentication page** - Shows redirect URIs
2. **API permissions page** - Shows granted permissions
3. **Overview page** - Shows Application (client) ID and Directory (tenant) ID
