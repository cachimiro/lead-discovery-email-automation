# 🚀 START HERE - Lead Pools Feature

## What's New?

You can now organize contacts into **pools** and select which pool to use when creating email campaigns!

## Quick Setup (3 Steps)

### 1️⃣ Run Database Migration

**Go to Supabase SQL Editor:**
https://app.supabase.com/project/zgrfotgxxoceyqslmexw/sql

**Copy and paste this file:**
`db/CREATE_LEAD_POOLS.sql`

**Click "Run"**

That's it! Tables are created.

### 2️⃣ Login

**Navigate to:** `/dev-login`

**Click:** "Login as Dev User"

### 3️⃣ Test It!

**Go to:** `/lead-pools`

You should see the Lead Pools page!

---

## Full Test Flow

See **QUICK_TEST_GUIDE.md** for complete step-by-step instructions.

## What You Can Do Now

✅ **Create Pools** - Organize contacts into groups
✅ **Assign Contacts** - Add contacts to multiple pools
✅ **Select Pools** - Choose which pool(s) to use in campaigns
✅ **Select Leads** - Fine-tune by selecting individual contacts
✅ **Track Campaigns** - See which pools were used

## New Pages

- `/lead-pools` - Manage your pools
- `/campaigns/[id]/select-pools` - Select pools for campaign
- `/campaigns/[id]/preview` - Now has lead selection checkboxes

## Files to Review

- `LEAD_POOLS_FEATURE.md` - Complete feature documentation
- `SETUP_LEAD_POOLS.md` - Setup and troubleshooting
- `QUICK_TEST_GUIDE.md` - Step-by-step testing guide
- `db/CREATE_LEAD_POOLS.sql` - Database migration

---

**Ready to test?** Follow the 3 steps above! 🎉
