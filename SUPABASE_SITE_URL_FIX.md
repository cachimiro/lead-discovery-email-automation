# Fix: localhost Connection Refused Error

## Problem
After OAuth login, you're being redirected to `localhost` instead of your Gitpod URL.

## Solution

### 1. Update Site URL in Supabase Dashboard

1. Go to: [https://supabase.com/dashboard/project/zgrfotgxxoceyqslmexw/auth/url-configuration](https://supabase.com/dashboard/project/zgrfotgxxoceyqslmexw/auth/url-configuration)

2. Update **Site URL** to your Gitpod URL:
   ```
   https://3000--0199f1d2-321c-780b-bc7e-3040f949b05b.eu-central-1-01.gitpod.dev
   ```

3. Add **Redirect URLs** (one per line):
   ```
   https://3000--0199f1d2-321c-780b-bc7e-3040f949b05b.eu-central-1-01.gitpod.dev/auth/callback
   https://3000--0199f1d2-321c-780b-bc7e-3040f949b05b.eu-central-1-01.gitpod.dev/**
   https://lead-discovery-app-sway-pr.vercel.app/auth/callback
   https://lead-discovery-app-sway-pr.vercel.app/**
   ```

4. Click **Save**

### 2. Alternative: Use Wildcard for Gitpod

If your Gitpod URL changes frequently, you can use wildcards:

**Redirect URLs:**
```
https://*.gitpod.dev/auth/callback
https://*.gitpod.dev/**
https://lead-discovery-app-sway-pr.vercel.app/auth/callback
https://lead-discovery-app-sway-pr.vercel.app/**
```

### 3. Clear Browser Cache

After updating Supabase settings:
1. Clear your browser cache and cookies
2. Close all browser tabs
3. Open a new incognito/private window
4. Try logging in again

## Where to Find These Settings

**Supabase Dashboard Path:**
1. Select your project: `zgrfotgxxoceyqslmexw`
2. Click **Authentication** in the left sidebar
3. Click **URL Configuration** tab
4. Update the settings as described above

## Important Notes

- The **Site URL** is the default redirect after authentication
- **Redirect URLs** is a whitelist of allowed redirect destinations
- Wildcards (`*`) are supported for development environments
- Changes take effect immediately (no restart needed)

## Test After Configuration

1. Visit: [https://3000--0199f1d2-321c-780b-bc7e-3040f949b05b.eu-central-1-01.gitpod.dev](https://3000--0199f1d2-321c-780b-bc7e-3040f949b05b.eu-central-1-01.gitpod.dev)
2. Click "Continue with Google" or "Continue with Microsoft"
3. Complete OAuth flow
4. You should be redirected back to your Gitpod URL at `/dashboard`
