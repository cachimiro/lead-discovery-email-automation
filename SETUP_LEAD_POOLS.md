# Lead Pools Setup Guide

## Quick Start

### Step 1: Run Database Migration

Execute the SQL migration to create the lead pools tables:

```bash
# Connect to your Supabase database
psql $DATABASE_URL < db/CREATE_LEAD_POOLS.sql
```

Or run it directly in Supabase SQL Editor:
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `db/CREATE_LEAD_POOLS.sql`
3. Paste and execute

### Step 2: Verify Installation

Check that the tables were created:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'cold_outreach_lead_pools%' 
   OR table_name LIKE 'cold_outreach_contact_pools%';

-- Check views exist
SELECT table_name 
FROM information_schema.views 
WHERE table_name LIKE '%pool%';

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%pool%';
```

Expected results:
- Tables: `cold_outreach_lead_pools`, `cold_outreach_contact_pools`
- Views: `cold_outreach_pool_stats`, `cold_outreach_contact_pool_memberships`
- Functions: `add_contacts_to_pool`, `remove_contacts_from_pool`, `get_contacts_in_pools`

### Step 3: Test the Feature

1. **Access Lead Pools**
   - Navigate to [http://localhost:3000/lead-pools](http://localhost:3000/lead-pools)
   - You should see the Lead Pools page

2. **Create Your First Pool**
   - Click "Create New Pool"
   - Enter name: "Test Pool"
   - Choose a color
   - Click "Create Pool"

3. **Add Contacts to Pool**
   - Go to Contacts page
   - Select some contacts (checkboxes)
   - Click "Add X to Pool"
   - Select your test pool
   - Verify contacts were added

4. **Create Campaign with Pool**
   - Go to Campaigns → Create New Campaign
   - Fill in email templates
   - Click "Save & Select Leads"
   - Select your test pool
   - Click "Continue to Preview"
   - Verify only contacts from your pool appear
   - Select/deselect individual contacts
   - Click "Start Campaign"

## Troubleshooting

### Tables Not Created

**Error**: `relation "cold_outreach_lead_pools" does not exist`

**Solution**:
1. Check you're connected to the correct database
2. Verify the SQL file executed without errors
3. Check for permission issues

### Functions Not Working

**Error**: `function add_contacts_to_pool does not exist`

**Solution**:
1. Re-run the SQL migration
2. Check function definitions in database:
   ```sql
   SELECT routine_name, routine_definition 
   FROM information_schema.routines 
   WHERE routine_name LIKE '%pool%';
   ```

### Pool Selection Not Showing

**Error**: Pool selection page is empty

**Solution**:
1. Create at least one pool first
2. Check browser console for API errors
3. Verify API endpoint is accessible: `GET /api/lead-pools`

### Contacts Not Filtering

**Error**: All contacts show in preview, not just pool contacts

**Solution**:
1. Verify `get_contacts_in_pools` function exists
2. Check query parameters are being passed: `?pools=uuid1,uuid2`
3. Check browser network tab for API call

## Configuration

### Default Pool Colors

Edit in `app/lead-pools/page.tsx`:

```typescript
const colors = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  // Add more colors here
];
```

### Pool Limits

No hard limits are set. To add limits:

1. **Per User Pool Limit**:
   ```sql
   ALTER TABLE cold_outreach_lead_pools 
   ADD CONSTRAINT max_pools_per_user 
   CHECK (
     (SELECT COUNT(*) FROM cold_outreach_lead_pools WHERE user_id = user_id) <= 50
   );
   ```

2. **Contacts Per Pool Limit**:
   Add validation in API endpoint `POST /api/lead-pools/[id]/contacts`

## API Testing

### Test Pool Creation

```bash
curl -X POST http://localhost:3000/api/lead-pools \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Pool",
    "description": "Testing pool creation",
    "color": "#3B82F6"
  }'
```

### Test Adding Contacts

```bash
curl -X POST http://localhost:3000/api/lead-pools/POOL_ID/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "contactIds": ["contact-uuid-1", "contact-uuid-2"]
  }'
```

### Test Getting Pool Contacts

```bash
curl http://localhost:3000/api/lead-pools/POOL_ID/contacts
```

## Performance Considerations

### Indexing

The migration includes these indexes:
- `lead_pools_user_id_idx` - Fast user pool lookups
- `contact_pools_contact_id_idx` - Fast contact pool lookups
- `contact_pools_pool_id_idx` - Fast pool contact lookups

### Large Pools

For pools with 1000+ contacts:
1. Consider pagination in pool detail view
2. Add caching for pool statistics
3. Use database views for aggregations

### Query Optimization

The `get_contacts_in_pools` function uses `DISTINCT` to avoid duplicates when contacts are in multiple selected pools. This is efficient for reasonable pool sizes.

## Security

### Row Level Security (RLS)

The migration enables RLS on all tables with permissive policies for development.

**For Production**, update policies:

```sql
-- Drop permissive policies
DROP POLICY "allow_all_pools" ON cold_outreach_lead_pools;
DROP POLICY "allow_all_contact_pools" ON cold_outreach_contact_pools;

-- Add restrictive policies
CREATE POLICY "users_own_pools" ON cold_outreach_lead_pools
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_contact_pools" ON cold_outreach_contact_pools
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cold_outreach_lead_pools 
      WHERE id = pool_id AND user_id = auth.uid()
    )
  );
```

### API Authentication

All API endpoints check for authenticated user:

```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Rollback

To remove the lead pools feature:

```sql
-- Drop tables (cascade removes dependent objects)
DROP TABLE IF EXISTS cold_outreach_contact_pools CASCADE;
DROP TABLE IF EXISTS cold_outreach_lead_pools CASCADE;

-- Drop views
DROP VIEW IF EXISTS cold_outreach_pool_stats CASCADE;
DROP VIEW IF EXISTS cold_outreach_contact_pool_memberships CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS add_contacts_to_pool CASCADE;
DROP FUNCTION IF EXISTS remove_contacts_from_pool CASCADE;
DROP FUNCTION IF EXISTS get_contacts_in_pools CASCADE;
DROP FUNCTION IF EXISTS update_pool_updated_at CASCADE;

-- Remove column from campaigns table
ALTER TABLE cold_outreach_email_campaigns 
DROP COLUMN IF EXISTS pool_ids;
```

Then remove the UI components and API routes.

## Support

- **Documentation**: See `LEAD_POOLS_FEATURE.md` for complete feature documentation
- **Database Schema**: See `db/CREATE_LEAD_POOLS.sql` for table definitions
- **API Reference**: See `LEAD_POOLS_FEATURE.md` → "New API Endpoints" section

---

**Setup Complete!** 🎉

You can now organize contacts into pools and create targeted campaigns.
