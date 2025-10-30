# 🚀 Quick Deployment Guide

Your application is ready to deploy to Digital Ocean! Follow these simple steps.

## 📋 What You Need

1. **Digital Ocean Account** - [Sign up here](https://www.digitalocean.com/)
2. **Supabase Account** - Already set up ✅
3. **Google OAuth** - Already configured ✅
4. **Microsoft OAuth** - Already configured ✅

## 🎯 Recommended: Deploy with App Platform (Easiest)

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Ready for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 2: Deploy on Digital Ocean

1. Go to [Digital Ocean App Platform](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Select **"GitHub"** and authorize
4. Choose your repository
5. Click **"Next"**

### Step 3: Configure Settings

**Build Settings:**
- Build Command: `npm run build`
- Run Command: `npm start`
- Keep other defaults

**Environment Variables:** Click "Edit" and add these:

```
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://zgrfotgxxoceyqslmexw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpncmZvdGd4eG9jZXlxc2xtZXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0OTM1NDksImV4cCI6MjA2MzA2OTU0OX0.tzGyLiUIYf2PMm3ZQmsw8ZK65nh74ZIzfzDwxcHjKVg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpncmZvdGd4eG9jZXlxc2xtZXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzQ5MzU0OSwiZXhwIjoyMDYzMDY5NTQ5fQ.4s3qC364B6qTb33ZFjAqNMR0EfRSnZD_bZFFDiXexfg
NEXTAUTH_URL=https://YOUR-APP-NAME.ondigitalocean.app
NEXTAUTH_SECRET=GENERATE_A_RANDOM_SECRET_HERE
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
MICROSOFT_CLIENT_ID=YOUR_MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET=YOUR_MICROSOFT_CLIENT_SECRET
MICROSOFT_TENANT_ID=common
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 4: Choose Plan

- **Basic Plan**: $5/month (512MB RAM) - Good for starting
- **Professional**: $12/month (1GB RAM) - Better performance

### Step 5: Deploy!

1. Click **"Create Resources"**
2. Wait 5-10 minutes for deployment
3. Your app will be live at: `https://your-app-name.ondigitalocean.app`

### Step 6: Update OAuth Redirect URLs

**Google OAuth Console:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth client
3. Add to "Authorized redirect URIs":
   ```
   https://your-app-name.ondigitalocean.app/api/auth/callback/google
   ```

**Microsoft Azure Portal:**
1. Go to [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Select your app
3. Go to "Authentication"
4. Add redirect URI:
   ```
   https://your-app-name.ondigitalocean.app/api/auth/callback/azure-ad
   ```

### Step 7: Test Your Deployment

1. Visit your app URL
2. Try logging in with Google
3. Try logging in with Microsoft
4. Create a test campaign
5. Check the monitor page

---

## 🐳 Alternative: Deploy with Docker (Advanced)

If you prefer more control, you can deploy using Docker on a Digital Ocean Droplet.

### Quick Start

```bash
# 1. Create .env.production file
cp .env.example .env.production
nano .env.production  # Edit with your values

# 2. Run deployment script
./deploy.sh
```

For detailed Docker deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## ✅ Post-Deployment Checklist

Use [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) to ensure everything is configured correctly.

Quick checks:
- [ ] App is accessible at your URL
- [ ] Login with Google works
- [ ] Login with Microsoft works
- [ ] Can create campaigns
- [ ] Can add contacts
- [ ] Monitor page works

---

## 📊 Monitoring Your App

### View Application Status

Visit: `https://your-app-name.ondigitalocean.app/campaigns/[campaign-id]/monitor`

This shows:
- Email queue status
- Pending/sent/failed emails
- Template configuration
- Contact information

### View Logs (App Platform)

1. Go to your app in Digital Ocean
2. Click "Runtime Logs"
3. View real-time logs

### View Logs (Docker)

```bash
docker-compose logs -f
```

---

## 🔧 Common Issues

### "Campaign not found" error
- Verify database migrations are run in Supabase
- Check the SQL scripts in `/db` folder

### OAuth login not working
- Verify redirect URLs in Google/Microsoft consoles
- Check NEXTAUTH_URL matches your domain
- Ensure NEXTAUTH_SECRET is set

### Emails not sending
- Check monitor page: `/campaigns/[id]/monitor`
- Verify email queue status
- Check if contacts have matching industries

---

## 💰 Cost Breakdown

### Digital Ocean App Platform
- **Basic**: $5/month
- **Professional**: $12/month
- Includes: SSL, monitoring, auto-scaling

### Supabase
- **Free**: Up to 500MB database
- **Pro**: $25/month (8GB database)

### Total Monthly Cost
- **Minimum**: $5/month (App Platform Basic + Supabase Free)
- **Recommended**: $17/month (App Platform Professional + Supabase Free)

---

## 🆘 Need Help?

1. **Check logs** - Most issues show up in logs
2. **Monitor page** - `/campaigns/[id]/monitor` shows detailed status
3. **Health check** - `/api/health` shows if app is running
4. **Supabase logs** - Check Supabase dashboard for database issues

---

## 📚 Additional Resources

- [Full Deployment Guide](./DEPLOYMENT.md) - Detailed instructions
- [Production Checklist](./PRODUCTION_CHECKLIST.md) - Complete checklist
- [Digital Ocean Docs](https://docs.digitalocean.com/products/app-platform/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## 🎉 You're Ready!

Your application is production-ready and can be deployed in minutes. Choose the deployment method that works best for you:

- **App Platform** (Recommended) - Easiest, automatic deployments
- **Docker** - More control, manual deployments

Good luck with your deployment! 🚀
