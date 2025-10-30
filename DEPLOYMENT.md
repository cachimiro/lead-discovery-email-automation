# Deployment Guide - Digital Ocean

This guide will help you deploy the Lead Discovery Email Automation application to Digital Ocean.

## Prerequisites

1. Digital Ocean account
2. Domain name (optional but recommended)
3. Supabase account with database set up
4. Google OAuth credentials (for login)
5. Microsoft OAuth credentials (for login)

## Option 1: Deploy with Digital Ocean App Platform (Recommended)

### Step 1: Prepare Your Repository

1. Push your code to GitHub/GitLab/Bitbucket
2. Ensure all environment variables are documented

### Step 2: Create App on Digital Ocean

1. Go to [Digital Ocean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Connect your GitHub/GitLab repository
4. Select the repository and branch (main/master)

### Step 3: Configure Build Settings

**Build Command:**
```bash
npm run build
```

**Run Command:**
```bash
npm start
```

**Environment Variables:** (Add these in the App Platform settings)

```env
# Required
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_URL=https://your-app.ondigitalocean.app
NEXTAUTH_SECRET=generate-a-random-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=common
```

### Step 4: Configure Resources

- **Instance Size:** Basic (512MB RAM, 1 vCPU) - $5/month
- **Instance Count:** 1 (can scale up later)

### Step 5: Deploy

1. Click "Create Resources"
2. Wait for deployment (5-10 minutes)
3. Your app will be available at: `https://your-app-name.ondigitalocean.app`

---

## Option 2: Deploy with Docker on Digital Ocean Droplet

### Step 1: Create a Droplet

1. Go to Digital Ocean Dashboard
2. Create Droplet:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic - $6/month (1GB RAM, 1 vCPU)
   - **Datacenter:** Choose closest to your users
   - **Authentication:** SSH keys (recommended)

### Step 2: Connect to Your Droplet

```bash
ssh root@your-droplet-ip
```

### Step 3: Install Docker

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

### Step 4: Clone Your Repository

```bash
# Install git if not present
apt install git -y

# Clone your repository
git clone https://github.com/your-username/lead-discovery-email-automation.git
cd lead-discovery-email-automation
```

### Step 5: Create Environment File

```bash
nano .env.production
```

Add your environment variables:

```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=common
```

### Step 6: Build and Run with Docker

```bash
# Build the Docker image
docker-compose build

# Start the application
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Step 7: Configure Nginx (Optional - for custom domain)

```bash
# Install Nginx
apt install nginx -y

# Create Nginx configuration
nano /etc/nginx/sites-available/lead-discovery
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/lead-discovery /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 8: Install SSL Certificate (Recommended)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is set up automatically
```

---

## Post-Deployment Steps

### 1. Update OAuth Redirect URLs

**Google OAuth Console:**
- Add: `https://your-domain.com/api/auth/callback/google`

**Microsoft Azure Portal:**
- Add: `https://your-domain.com/api/auth/callback/azure-ad`

### 2. Run Database Migrations

Make sure all SQL scripts have been run in Supabase:

```sql
-- Run these in Supabase SQL Editor in order:
1. CREATE_LEAD_POOLS.sql
2. ADD_CONTACT_ID_TO_QUEUE.sql
3. ADD_ON_HOLD_STATUS.sql
4. FIX_CAMPAIGN_FOREIGN_KEY.sql
```

### 3. Test the Application

1. Visit your deployed URL
2. Test login with Google/Microsoft
3. Create a test campaign
4. Verify email queue is working

### 4. Set Up Monitoring

**Digital Ocean Monitoring:**
- Enable monitoring in your Droplet/App settings
- Set up alerts for CPU, memory, and disk usage

**Application Monitoring:**
- Check logs regularly: `docker-compose logs -f`
- Monitor the `/campaigns/[id]/monitor` page for email queue status

---

## Maintenance

### Update the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Backup Database

Your data is in Supabase, which has automatic backups. To create manual backups:

1. Go to Supabase Dashboard
2. Settings → Database → Backups
3. Click "Create Backup"

### View Logs

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs app
```

### Restart Application

```bash
docker-compose restart
```

### Stop Application

```bash
docker-compose down
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
docker-compose logs

# Verify environment variables
docker-compose config

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Issues

1. Verify Supabase URL and keys in environment variables
2. Check Supabase dashboard for service status
3. Ensure IP is not blocked in Supabase settings

### OAuth Login Not Working

1. Verify redirect URLs in Google/Microsoft consoles
2. Check NEXTAUTH_URL matches your domain
3. Ensure NEXTAUTH_SECRET is set and secure

---

## Scaling

### Vertical Scaling (More Resources)

**App Platform:**
- Go to Settings → Resources
- Upgrade to Professional plan ($12/month for 1GB RAM)

**Droplet:**
- Resize droplet in Digital Ocean dashboard
- Choose larger plan with more RAM/CPU

### Horizontal Scaling (More Instances)

**App Platform:**
- Go to Settings → Resources
- Increase instance count to 2 or more
- Load balancing is automatic

---

## Cost Estimate

### App Platform (Recommended for beginners)
- Basic: $5/month
- Professional: $12/month
- Includes: Automatic deployments, SSL, monitoring

### Droplet + Docker
- Droplet: $6/month (1GB RAM)
- Domain: $12/year (optional)
- Total: ~$6-7/month

### Supabase
- Free tier: Up to 500MB database, 2GB bandwidth
- Pro: $25/month (8GB database, 50GB bandwidth)

---

## Security Checklist

- [ ] All environment variables are set correctly
- [ ] NEXTAUTH_SECRET is a strong random string
- [ ] SSL certificate is installed and working
- [ ] Firewall is configured (only ports 80, 443, 22 open)
- [ ] SSH key authentication is enabled
- [ ] Regular backups are configured
- [ ] Monitoring and alerts are set up
- [ ] OAuth redirect URLs are correct
- [ ] Supabase RLS policies are enabled

---

## Support

For issues or questions:
1. Check application logs
2. Review Supabase logs
3. Check the monitor page: `/campaigns/[id]/monitor`
4. Verify all environment variables are correct

---

## Quick Start Commands

```bash
# Clone repository
git clone https://github.com/your-username/lead-discovery-email-automation.git
cd lead-discovery-email-automation

# Create environment file
cp .env.example .env.production
nano .env.production

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Your application should now be running at `http://your-droplet-ip:3000` or your custom domain!
