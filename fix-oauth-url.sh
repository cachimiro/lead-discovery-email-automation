#!/bin/bash

echo "=========================================="
echo "OAuth Redirect URI Fix Script"
echo "=========================================="
echo ""
echo "Current NEXTAUTH_URL in .env:"
grep "NEXTAUTH_URL=" .env
echo ""

if [ -z "$1" ]; then
    echo "❌ Error: No URL provided"
    echo ""
    echo "Usage:"
    echo "  ./fix-oauth-url.sh YOUR_WORKSPACE_URL"
    echo ""
    echo "Example:"
    echo "  ./fix-oauth-url.sh https://3000--019a02f5-6922-73b9-a0ce-9e951dc56da2.gitpod.io"
    echo ""
    echo "📋 To get your workspace URL:"
    echo "   1. Navigate to /oauth-setup in your browser"
    echo "   2. Copy the URL shown on that page"
    echo "   3. Run this script with that URL"
    echo ""
    exit 1
fi

NEW_URL="$1"

# Remove trailing slash if present
NEW_URL="${NEW_URL%/}"

echo "Updating NEXTAUTH_URL to: $NEW_URL"
echo ""

# Backup .env
cp .env .env.backup
echo "✅ Created backup: .env.backup"

# Update NEXTAUTH_URL
sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=$NEW_URL|" .env
echo "✅ Updated .env file"
echo ""

echo "New configuration:"
grep "NEXTAUTH_URL=" .env
echo ""

echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. ✅ .env file updated"
echo ""
echo "2. 📝 Update Google Cloud Console:"
echo "   URL: https://console.cloud.google.com/apis/credentials"
echo "   Add redirect URI: $NEW_URL/api/auth/callback/google"
echo ""
echo "3. 📝 Update Azure Portal:"
echo "   URL: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
echo "   Add redirect URI: $NEW_URL/api/auth/callback/azure-ad"
echo ""
echo "4. 🔄 Restart your dev server:"
echo "   - Stop current server (Ctrl+C)"
echo "   - Run: npm run dev"
echo ""
echo "5. 🧪 Test login at: $NEW_URL/login"
echo ""
echo "=========================================="
