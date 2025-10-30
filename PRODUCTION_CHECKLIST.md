# Production Deployment Checklist

## Pre-Deployment

### Database Setup
- [ ] All SQL migrations have been run in Supabase:
  - [ ] `CREATE_LEAD_POOLS.sql`
  - [ ] `ADD_CONTACT_ID_TO_QUEUE.sql`
  - [ ] `ADD_ON_HOLD_STATUS.sql`
  - [ ] `FIX_CAMPAIGN_FOREIGN_KEY.sql`
  - [ ] Fixed `get_contacts_in_pools` function to include `industry` field
- [ ] Supabase Row Level Security (RLS) policies are configured
- [ ] Database backups are enabled in Supabase

### Environment Variables
- [ ] Copy `.env.example` to `.env.production`
- [ ] Set `NODE_ENV=production`
- [ ] Configure Supabase credentials
- [ ] Set `NEXTAUTH_URL` to your production domain
- [ ] Generate secure `NEXTAUTH_SECRET` (32+ characters)
- [ ] Configure Google OAuth credentials
- [ ] Configure Microsoft OAuth credentials
- [ ] All secrets are secure and not committed to git

### OAuth Configuration
- [ ] Google OAuth Console:
  - [ ] Add production redirect URL: `https://your-domain.com/api/auth/callback/google`
  - [ ] Add authorized JavaScript origins: `https://your-domain.com`
- [ ] Microsoft Azure Portal:
  - [ ] Add production redirect URL: `https://your-domain.com/api/auth/callback/azure-ad`
  - [ ] Set tenant to `common` for multi-tenant support

### Code Review
- [ ] All console.logs removed or replaced with proper logging
- [ ] No hardcoded credentials or API keys
- [ ] Error handling is in place for all API routes
- [ ] All temporary/debug files removed
- [ ] `.gitignore` is properly configured

## Deployment

### Build Test
- [ ] Run `npm run build` locally to verify no build errors
- [ ] Test the production build locally: `npm start`
- [ ] Verify all pages load correctly
- [ ] Test authentication flow
- [ ] Test campaign creation and email queueing

### Docker (if using)
- [ ] Dockerfile is present and configured
- [ ] `.dockerignore` is configured
- [ ] Test Docker build: `docker-compose build`
- [ ] Test Docker run: `docker-compose up`
- [ ] Verify health endpoint: `http://localhost:3000/api/health`

### Digital Ocean Setup
- [ ] App Platform or Droplet is created
- [ ] Environment variables are configured
- [ ] Build and run commands are set
- [ ] Resources are allocated (minimum 512MB RAM)
- [ ] Domain is connected (if using custom domain)

## Post-Deployment

### Verification
- [ ] Application is accessible at production URL
- [ ] Health check endpoint works: `/api/health`
- [ ] Login with Google works
- [ ] Login with Microsoft works
- [ ] Can create a campaign
- [ ] Can add contacts
- [ ] Can add journalist leads
- [ ] Can preview campaign
- [ ] Can start campaign
- [ ] Emails are queued correctly
- [ ] Monitor page shows correct data: `/campaigns/[id]/monitor`

### Security
- [ ] SSL certificate is installed and working (HTTPS)
- [ ] All HTTP traffic redirects to HTTPS
- [ ] Security headers are configured
- [ ] CORS is properly configured
- [ ] Rate limiting is in place (if needed)
- [ ] Firewall rules are configured (if using Droplet)

### Monitoring
- [ ] Digital Ocean monitoring is enabled
- [ ] Application logs are accessible
- [ ] Error tracking is set up (optional: Sentry)
- [ ] Uptime monitoring is configured (optional)
- [ ] Alerts are configured for:
  - [ ] High CPU usage
  - [ ] High memory usage
  - [ ] Application crashes
  - [ ] Failed deployments

### Performance
- [ ] Page load times are acceptable
- [ ] API response times are fast
- [ ] Database queries are optimized
- [ ] Images are optimized (if any)
- [ ] Caching is configured where appropriate

### Backup & Recovery
- [ ] Database backup schedule is configured in Supabase
- [ ] Manual backup has been tested
- [ ] Recovery procedure is documented
- [ ] Environment variables are backed up securely

## Ongoing Maintenance

### Weekly
- [ ] Check application logs for errors
- [ ] Monitor email queue status
- [ ] Review campaign performance
- [ ] Check disk space usage (if using Droplet)

### Monthly
- [ ] Review and update dependencies: `npm outdated`
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] Review database performance
- [ ] Test backup restoration
- [ ] Review monitoring alerts

### As Needed
- [ ] Update application code
- [ ] Run new database migrations
- [ ] Scale resources if needed
- [ ] Update OAuth credentials if changed
- [ ] Renew SSL certificates (auto-renewed with Let's Encrypt)

## Rollback Plan

If something goes wrong:

1. **App Platform:**
   - Go to Activity tab
   - Click "Rollback" on previous successful deployment

2. **Docker/Droplet:**
   ```bash
   # Stop current version
   docker-compose down
   
   # Checkout previous version
   git checkout <previous-commit>
   
   # Rebuild and restart
   docker-compose build
   docker-compose up -d
   ```

3. **Database:**
   - Restore from Supabase backup
   - Re-run any failed migrations

## Support Contacts

- **Supabase Support:** https://supabase.com/support
- **Digital Ocean Support:** https://www.digitalocean.com/support
- **Application Issues:** Check `/campaigns/[id]/monitor` page

## Quick Commands

```bash
# View logs (Docker)
docker-compose logs -f

# Restart application (Docker)
docker-compose restart

# Update application (Docker)
git pull && docker-compose down && docker-compose build && docker-compose up -d

# Check health
curl https://your-domain.com/api/health

# View database in Supabase
# Go to: https://app.supabase.com/project/_/editor
```

---

## Deployment Complete! 🎉

Once all items are checked, your application is ready for production use.

Remember to:
- Monitor the application regularly
- Keep dependencies updated
- Back up your data
- Test new features in a staging environment first
