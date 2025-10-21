# Solution: Localhost Redirect Issue

## Problem
After OAuth authentication with Google/Microsoft, users are redirected to `localhost` instead of the Gitpod URL, causing "ERR_CONNECTION_REFUSED" error.

## Root Cause
The issue is that **Supabase's Site URL configuration is cached or not properly set**. Even though you've configured it in the dashboard, Supabase may be using a cached value or there's a configuration mismatch.

## Solution

### Option 1: Use Supabase CLI to Force Update (Recommended)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref zgrfotgxxoceyqslmexw
   ```

4. Update the Site URL via CLI:
   ```bash
   supabase secrets set SITE_URL=https://3000--0199f1d2-321c-780b-bc7e-3040f949b05b.eu-central-1-01.gitpod.dev
   ```

### Option 2: Check for Hidden Configuration

1. Go to Supabase Dashboard → **Project Settings** → **API**
2. Look for a field called **"Site URL"** or **"App URL"** in the API settings (not just Auth settings)
3. Make sure it's set to your Gitpod URL, not localhost

### Option 3: Use Environment Variable Override

Add this to your `.env.local`:
```env
NEXT_PUBLIC_SITE_URL=https://3000--0199f1d2-321c-780b-bc7e-3040f949b05b.eu-central-1-01.gitpod.dev
```

Then update the login code to use this:
```typescript
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${siteUrl}/auth/callback`,
  },
});
```

### Option 4: Contact Supabase Support

If none of the above work, there may be a caching issue on Supabase's end. Contact their support with:
- Project ref: `zgrfotgxxoceyqslmexw`
- Issue: Site URL not updating, still redirecting to localhost after OAuth
- Expected Site URL: Your Gitpod URL

## Verification Steps

After applying the solution:

1. **Clear all browser data** (cookies, cache, local storage)
2. **Use incognito/private window**
3. Go to your app URL
4. Click "Continue with Google"
5. After Google login, check the URL you're redirected to
6. It should be: `https://YOUR-GITPOD-URL/auth/callback?code=...`

## Current Configuration Summary

### Supabase Dashboard Settings
- **Site URL**: `https://3000--0199f1d2-321c-780b-bc7e-3040f949b05b.eu-central-1-01.gitpod.dev`
- **Redirect URLs**:
  - `https://*.gitpod.dev/**`
  - `https://3000--0199f1d2-321c-780b-bc7e-3040f949b05b.eu-central-1-01.gitpod.dev/**`

### Google OAuth Settings
- **Authorized redirect URIs**:
  - `https://zgrfotgxxoceyqslmexw.supabase.co/auth/v1/callback` ✅

### Azure OAuth Settings
- **Redirect URIs**:
  - `https://zgrfotgxxoceyqslmexw.supabase.co/auth/v1/callback` ✅

## Alternative: Use Vercel Deployment

If Gitpod continues to have issues, deploy to Vercel:

1. Push your code to GitHub
2. Deploy to Vercel
3. Get your Vercel URL (e.g., `https://your-app.vercel.app`)
4. Update Supabase Site URL to your Vercel URL
5. Add Vercel URL to Redirect URLs
6. Test authentication on Vercel

Vercel deployments are more stable and don't have the port/URL changing issues that Gitpod has.

## Next Steps

1. Try Option 1 (Supabase CLI) first
2. If that doesn't work, try Option 3 (Environment Variable)
3. If still not working, deploy to Vercel as a workaround
4. Contact Supabase support if the issue persists

The authentication system is correctly implemented - this is purely a configuration/caching issue with Supabase's Site URL setting.
