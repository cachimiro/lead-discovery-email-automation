#!/bin/bash

echo "🚀 Setting up Lead Pools database tables..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if Supabase URL is set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not found in .env"
    exit 1
fi

echo "📝 Please run the SQL migration manually:"
echo ""
echo "1. Go to: ${NEXT_PUBLIC_SUPABASE_URL/https:\/\//https://app.}/project/_/sql"
echo ""
echo "2. Copy the contents of: db/CREATE_LEAD_POOLS.sql"
echo ""
echo "3. Paste into the SQL Editor and click 'Run'"
echo ""
echo "4. Verify tables were created:"
echo "   - cold_outreach_lead_pools"
echo "   - cold_outreach_contact_pools"
echo ""
echo "5. Then restart your dev server: npm run dev"
echo ""
echo "✅ After running the SQL, you'll be ready to use Lead Pools!"
