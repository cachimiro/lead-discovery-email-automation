# 🚀 Getting Started with Lead Discovery & Email Automation

## ✅ What's Ready

Your application is fully configured and running:
- ✅ Server running on port 3000
- ✅ Google OAuth login configured
- ✅ Microsoft OAuth login configured
- ✅ All API routes working with OAuth authentication
- ✅ Contact management system ready
- ✅ Lead pool management ready
- ✅ Campaign system ready

---

## 🎯 Quick Start Guide

### Step 1: Access Your Application

**Your App URL:**
```
https://3000--019a0442-73bc-74c1-bda9-07a3429fe00e.eu-central-1-01.gitpod.dev
```

### Step 2: Login

Go to the login page and choose:
- **"Continue with Google"** - Login with your Google account
- **"Continue with Microsoft"** - Login with your Microsoft account

After login, you'll be redirected to the **Dashboard**.

---

## 📋 Main Features

### 1. **Dashboard** (`/dashboard`)
- Overview of your stats
- Quick access to all features
- See total contacts, campaigns, and leads

### 2. **Contacts** (`/contacts`)
- View all your contacts
- Add new contacts manually
- Import contacts from CSV
- Manage contact information

### 3. **Lead Pools** (`/lead-pools`)
- Create pools to organize contacts
- Add contacts to pools
- View pool statistics
- Manage multiple pools

### 4. **Campaigns** (`/campaigns`)
- Create email campaigns
- Select lead pools for campaigns
- Preview emails before sending
- Track campaign performance

### 5. **Lead Discovery** (`/discover`)
- Discover new leads
- AI-powered lead finding
- Import discovered leads to pools

---

## 🎬 Your First Campaign

### Step 1: Create Contacts
1. Go to **Contacts** (`/contacts`)
2. Click **"Add Contact"**
3. Fill in contact details (email, name, company)
4. Click **"Save"**

### Step 2: Create a Lead Pool
1. Go to **Lead Pools** (`/lead-pools`)
2. Click **"Create New Pool"**
3. Give it a name (e.g., "Tech Startups")
4. Add contacts to the pool

### Step 3: Create a Campaign
1. Go to **Campaigns** (`/campaigns`)
2. Click **"New Campaign"**
3. Fill in campaign details:
   - Campaign name
   - Email subject
   - Email content
4. Click **"Continue"**

### Step 4: Select Lead Pools
1. Choose which pools to include
2. Or click **"Quick Add"** to add contacts directly
3. Review total contacts
4. Click **"Continue"**

### Step 5: Preview & Send
1. Preview your email
2. Review recipients
3. Click **"Start Campaign"**

---

## 🔧 Key Features Explained

### Contact Management
- **Add contacts individually** - Manual entry
- **Import from CSV** - Bulk import
- **Organize with pools** - Group by category
- **Track engagement** - See who responds

### Lead Pools
- **Organize contacts** - Group by industry, stage, etc.
- **Quick add contacts** - Two ways:
  - **Select Existing** - Choose from your contacts
  - **Create New** - Add new contact directly
- **Import from discovered leads** - Add AI-found leads
- **View statistics** - See pool size and activity

### Email Campaigns
- **Personalized emails** - Use variables like {{firstName}}
- **Pool-based targeting** - Send to specific groups
- **Preview before sending** - See exactly what recipients get
- **Track performance** - Monitor opens, clicks, replies

---

## 📧 Email Sending Setup (Optional)

To actually send emails, you need to configure SendGrid:

### Get SendGrid API Key
1. Go to: https://app.sendgrid.com/
2. Sign up or login
3. Navigate to: Settings → API Keys
4. Create new API key with "Mail Send" permissions
5. Copy the API key

### Update Configuration
1. Open `.env` file
2. Update these lines:
```bash
SENDGRID_API_KEY=SG.your_actual_api_key_here
SENDGRID_VERIFIED_SENDER=your-email@domain.com
```
3. Restart the server

### Verify Sender Email
1. In SendGrid: Settings → Sender Authentication
2. Verify your sender email address
3. Follow the verification steps

---

## 🎨 Using the Tabbed Contact Modal

When adding contacts to a pool, you'll see a tabbed interface:

### Tab 1: Select Existing
- Search through your existing contacts
- Select multiple contacts at once
- See contact details (email, company, title)
- Click checkboxes to select
- Click "Add Selected Contacts"

### Tab 2: Create New
- Add a brand new contact
- Fill in: Email, First Name, Last Name, Company, Title
- Contact is created AND added to pool
- Click "Create & Add Contact"

---

## 🔍 Testing Your Setup

### Test Authentication
Go to: `/test-auth`

This page shows:
- Your session status
- User information
- API connectivity test
- Full debug information

### Test Contact Management
1. Go to `/contacts`
2. Add a test contact
3. Go to `/lead-pools`
4. Create a test pool
5. Add the contact to the pool

### Test Campaign Flow
1. Create a campaign
2. Select pools
3. Preview the email
4. (Don't send yet if SendGrid isn't configured)

---

## 🆘 Troubleshooting

### "Unauthorized" Errors
- Make sure you're logged in
- Try logging out and back in
- Check `/test-auth` to verify session

### Can't Add Contacts to Pool
- Verify you're logged in with OAuth (not dev-login)
- Check browser console for errors
- Server should be running (check terminal)

### OAuth Login Not Working
- Verify redirect URIs are added to Google/Microsoft
- Check that URLs match exactly
- Wait 1-2 minutes after adding redirect URIs

### Server Not Responding
```bash
# Restart the server:
killall node
cd /workspaces/lead-discovery-email-automation
npm run dev
```

---

## 📚 Additional Resources

### Documentation Files
- `YOUR-OAUTH-URLS.md` - Your specific OAuth configuration
- `OAUTH-SETUP-GUIDE.md` - Detailed OAuth setup
- `AUTHENTICATION-GUIDE.md` - All authentication options
- `SERVER-STATUS.md` - Current server status

### API Endpoints
- `/api/contacts` - Contact management
- `/api/lead-pools` - Pool management
- `/api/campaigns` - Campaign management
- `/api/auth/*` - Authentication endpoints

---

## 🎉 You're Ready!

Everything is set up and working. Here's what to do next:

1. ✅ **Login** with Google or Microsoft
2. ✅ **Add some contacts** to get started
3. ✅ **Create a lead pool** to organize them
4. ✅ **Create your first campaign**
5. ✅ **Configure SendGrid** when ready to send emails

---

## 💡 Pro Tips

1. **Use lead pools** to organize contacts by industry, stage, or campaign
2. **Test with yourself first** - Add your own email and send a test campaign
3. **Preview before sending** - Always check the preview page
4. **Start small** - Test with a few contacts before scaling up
5. **Track results** - Monitor campaign performance in the dashboard

---

**Need help?** Check the `/test-auth` page to verify everything is working correctly.

**Ready to go?** Start by adding your first contact at `/contacts`! 🚀
