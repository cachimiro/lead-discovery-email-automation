# Skip Authentication for Testing

## Quick Fix to Test Campaign Workflow

If OAuth is giving you trouble, here's how to bypass it temporarily:

### Option 1: Use Dev Login Page

Go to: `/dev-login`

This will log you in as a test user instantly.

### Option 2: Disable Auth Check (Temporary)

Edit `lib/auth.ts` and comment out the redirect:

```typescript
export async function requireAuth() {
  // const session = await getServerSession(authOptions);
  // if (!session?.user) {
  //   redirect("/login");
  // }
  
  // Return a fake user for testing
  return {
    id: "test-user-123",
    email: "test@example.com",
    name: "Test User"
  };
}
```

Then restart the server and go directly to `/campaigns/new`

### Option 3: Fix Google OAuth

1. Go to: https://console.cloud.google.com/
2. Navigate to: APIs & Services → Credentials
3. Click your OAuth 2.0 Client ID
4. Add to "Authorized redirect URIs":
   ```
   https://3001-0199f1d2-321c-780b-bc7e-3040f949b05b.eu-central-1-01.gitpod.dev/api/auth/callback/google
   ```
5. Save and wait 5 minutes
6. Try logging in again

---

**Recommended: Use Option 1 (Dev Login) - it's the fastest way to test!**
