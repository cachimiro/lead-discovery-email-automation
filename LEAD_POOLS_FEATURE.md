# Lead Pools & Campaign Targeting Feature

## Overview

This feature adds the ability to organize contacts into pools/categories and select specific pools or individual leads when creating campaigns. This gives users fine-grained control over which contacts receive each campaign.

## What's New

### 1. Lead Pools System
- **Create Pools**: Organize contacts into named collections (e.g., "Q1 Sales Leads", "Enterprise Prospects")
- **Color Coding**: Each pool has a customizable color for easy visual identification
- **Multi-Pool Membership**: Contacts can belong to multiple pools simultaneously
- **Pool Statistics**: See contact count for each pool at a glance

### 2. Enhanced Campaign Creation Flow

**Old Flow:**
```
Create Templates → Preview → Start Campaign
```

**New Flow:**
```
Create Templates → Select Pools → Preview & Select Leads → Start Campaign
```

### 3. Granular Lead Selection
- Select which pools to include in a campaign
- Further refine by selecting/deselecting individual contacts in the preview
- See real-time count of selected contacts
- Campaign only sends to selected contacts

## Database Changes

### New Tables

#### `cold_outreach_lead_pools`
Stores pool definitions:
- `id` - UUID primary key
- `user_id` - Owner of the pool
- `name` - Pool name (unique per user)
- `description` - Optional description
- `color` - Hex color code for UI display
- `created_at`, `updated_at` - Timestamps

#### `cold_outreach_contact_pools`
Many-to-many junction table:
- `contact_id` - References cold_outreach_contacts
- `pool_id` - References cold_outreach_lead_pools
- `added_at` - When contact was added to pool
- Primary key: (contact_id, pool_id)

### Modified Tables

#### `cold_outreach_email_campaigns`
Added:
- `pool_ids` - Array of pool IDs used in campaign (for tracking)

### Database Functions

#### `add_contacts_to_pool(pool_id, contact_ids[])`
Bulk add contacts to a pool. Returns count of contacts added.

#### `remove_contacts_from_pool(pool_id, contact_ids[])`
Bulk remove contacts from a pool. Returns count of contacts removed.

#### `get_contacts_in_pools(user_id, pool_ids[])`
Get all contacts that belong to any of the specified pools.

### Views

#### `cold_outreach_pool_stats`
Aggregated view showing:
- Pool details
- Contact count per pool
- Useful for listing pools with statistics

#### `cold_outreach_contact_pool_memberships`
Shows each contact with their pool memberships as JSON array.

## New Pages

### `/lead-pools`
**Lead Pools Management Page**
- Grid view of all pools
- Create new pool button
- Each pool card shows:
  - Pool name and color
  - Description
  - Contact count
  - Actions: View Contacts, Edit, Delete
- Empty state with call-to-action

### `/lead-pools/[id]` (Future)
**Pool Detail Page** (not yet implemented)
- List all contacts in the pool
- Add/remove contacts
- Edit pool details

### `/campaigns/[id]/select-pools`
**Pool Selection Page**
- Shows all available pools
- Multi-select interface
- Shows contact count per pool
- Running total of selected contacts
- Option to skip and use all contacts

## Modified Pages

### `/campaigns/new`
**Campaign Creation**
- Changed button text: "Save & Select Leads →"
- Now redirects to pool selection instead of preview

### `/campaigns/[id]/preview`
**Campaign Preview**
- Added pool filtering (via query params)
- Added individual lead selection with checkboxes
- Shows selection statistics:
  - Total contacts
  - Selected contacts
  - Emails per contact
  - Total emails to send
- "Select All" / "Deselect All" button
- Start button shows selected count
- Start button disabled if no contacts selected

### `/contacts`
**Contacts List**
- Added "Add to Pool" button (appears when contacts are selected)
- Bulk action to add selected contacts to a pool
- Pool selection modal
- Link to create pools if none exist

## New API Endpoints

### Pool Management

#### `GET /api/lead-pools`
List all pools for the current user with statistics.

**Response:**
```json
{
  "success": true,
  "pools": [
    {
      "id": "uuid",
      "name": "Q1 Sales Leads",
      "description": "High-priority leads for Q1",
      "color": "#3B82F6",
      "contact_count": 45,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `POST /api/lead-pools`
Create a new pool.

**Request:**
```json
{
  "name": "Q1 Sales Leads",
  "description": "High-priority leads for Q1",
  "color": "#3B82F6"
}
```

#### `GET /api/lead-pools/[id]`
Get a specific pool with statistics.

#### `PUT /api/lead-pools/[id]`
Update pool details.

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "color": "#10B981"
}
```

#### `DELETE /api/lead-pools/[id]`
Delete a pool (contacts are not deleted, only the pool).

### Pool Contacts

#### `GET /api/lead-pools/[id]/contacts`
Get all contacts in a specific pool.

#### `POST /api/lead-pools/[id]/contacts`
Add contacts to a pool.

**Request:**
```json
{
  "contactIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "added": 3,
  "message": "Added 3 contact(s) to pool"
}
```

#### `DELETE /api/lead-pools/[id]/contacts`
Remove contacts from a pool.

**Request:**
```json
{
  "contactIds": ["uuid1", "uuid2"]
}
```

### Campaign Pools

#### `POST /api/campaigns/[id]/pools`
Save pool selection for a campaign.

**Request:**
```json
{
  "poolIds": ["uuid1", "uuid2"]
}
```

### Modified Endpoints

#### `GET /api/campaigns/[id]/preview`
Now accepts `?pools=uuid1,uuid2` query parameter to filter contacts by pools.

#### `POST /api/email-automation/start-campaign`
Now accepts `selectedEmails` array to only send to specific contacts.

**Request:**
```json
{
  "campaignId": "campaign-123",
  "selectedEmails": ["email1@example.com", "email2@example.com"],
  "maxEmailsPerDay": 28,
  "sendingStartHour": 9,
  "sendingEndHour": 17,
  "followUpDelayDays": 3,
  "skipWeekends": true
}
```

## User Workflow

### Creating and Using Pools

1. **Create Pools**
   - Navigate to "Lead Pools" in sidebar
   - Click "Create New Pool"
   - Enter name, description, and choose color
   - Save

2. **Add Contacts to Pools**
   - Go to "Contacts" page
   - Select contacts using checkboxes
   - Click "Add X to Pool" button
   - Choose pool from modal
   - Contacts are added to pool

3. **Create Targeted Campaign**
   - Go to "Campaigns" → "Create New Campaign"
   - Create email templates
   - Click "Save & Select Leads"
   - Select one or more pools
   - Click "Continue to Preview"
   - Review matched contacts
   - Select/deselect individual contacts if needed
   - Click "Start Campaign (X contacts)"

### Skipping Pool Selection

Users can skip pool selection to use all contacts:
- On pool selection page, click "Skip & Use All Contacts"
- This maintains backward compatibility with existing workflow

## Benefits

### For Users
- **Better Organization**: Group contacts by campaign type, priority, or any custom criteria
- **Targeted Campaigns**: Send campaigns to specific segments
- **Flexibility**: Contacts can be in multiple pools for different campaign types
- **Control**: Final review and selection before sending
- **Efficiency**: Reuse pools across multiple campaigns

### For System
- **Scalability**: Better performance when filtering large contact lists
- **Tracking**: Know which pools were used for each campaign
- **Analytics**: Future feature - pool performance metrics

## Migration Notes

### Backward Compatibility
- Existing campaigns continue to work
- Contacts without pools can still be used
- Pool selection is optional (can be skipped)
- `pool_ids` field defaults to empty array

### Data Migration
No data migration required. This is a purely additive feature.

### Deployment Steps

1. **Run SQL Migration**
   ```bash
   psql $DATABASE_URL < db/CREATE_LEAD_POOLS.sql
   ```

2. **Verify Tables Created**
   - cold_outreach_lead_pools
   - cold_outreach_contact_pools
   - Views and functions

3. **Deploy Application**
   - All new pages and API endpoints are included
   - No breaking changes to existing functionality

4. **Test Flow**
   - Create a pool
   - Add contacts to pool
   - Create campaign with pool selection
   - Verify emails only go to selected contacts

## Future Enhancements

### Potential Features
1. **Pool Templates**: Pre-defined pool types (e.g., "Hot Leads", "Cold Leads")
2. **Smart Pools**: Auto-add contacts based on rules (e.g., industry, company size)
3. **Pool Analytics**: Track performance metrics per pool
4. **Pool Sharing**: Share pools between team members
5. **Pool Import/Export**: Bulk operations via CSV
6. **Pool Hierarchy**: Nested pools or parent-child relationships
7. **Pool Tags**: Additional metadata for pools
8. **Pool Automation**: Automatically move contacts between pools based on engagement

### Technical Improvements
1. **Caching**: Cache pool statistics for better performance
2. **Pagination**: For pools with many contacts
3. **Search**: Search contacts within a pool
4. **Bulk Operations**: More bulk actions (move between pools, etc.)
5. **Audit Log**: Track pool membership changes

## Testing Checklist

- [ ] Create a new pool
- [ ] Edit pool details
- [ ] Delete a pool
- [ ] Add contacts to pool from contacts page
- [ ] Remove contacts from pool
- [ ] Create campaign with pool selection
- [ ] Skip pool selection
- [ ] Select/deselect individual contacts in preview
- [ ] Start campaign with selected contacts
- [ ] Verify only selected contacts receive emails
- [ ] Test with multiple pools selected
- [ ] Test with contacts in multiple pools (no duplicates)
- [ ] Test empty pool handling
- [ ] Test pool with no matching journalists

## Files Changed/Created

### Database
- ✅ `db/CREATE_LEAD_POOLS.sql` - Schema and functions

### Pages
- ✅ `app/lead-pools/page.tsx` - Pool management
- ✅ `app/campaigns/[id]/select-pools/page.tsx` - Pool selection
- ✅ `app/campaigns/new/page.tsx` - Modified redirect
- ✅ `app/campaigns/[id]/preview/page.tsx` - Added selection

### API Routes
- ✅ `app/api/lead-pools/route.ts` - List/create pools
- ✅ `app/api/lead-pools/[id]/route.ts` - Get/update/delete pool
- ✅ `app/api/lead-pools/[id]/contacts/route.ts` - Pool contacts
- ✅ `app/api/campaigns/[id]/pools/route.ts` - Campaign pool selection
- ✅ `app/api/campaigns/[id]/preview/route.ts` - Modified for pool filtering

### Components
- ✅ `components/contacts-list.tsx` - Added pool assignment
- ✅ `components/sidebar.tsx` - Added Lead Pools link

## Support

For questions or issues:
1. Check this documentation
2. Review the database schema in `CREATE_LEAD_POOLS.sql`
3. Check API endpoint documentation above
4. Review component code for implementation details

---

**Version**: 1.0  
**Date**: 2024-10-24  
**Status**: ✅ Complete and Ready for Testing
