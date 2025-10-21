# Email Automation Implementation Plan

## ⚠️ CRITICAL: This is a Complex System

This email automation system handles:
- **Money at stake:** Incorrect sending could damage client relationships
- **Precision required:** Exact timing, rate limiting, response tracking
- **Multiple integrations:** Gmail API, Outlook API, Cron jobs
- **Complex logic:** Business day calculations, follow-up chains, response detection

**Recommendation:** This should be implemented in phases with thorough testing at each step.

---

## Phase 1: Database Setup ✅ READY

### Files Created:
1. `db/CREATE_EMAIL_AUTOMATION_TABLES.sql` - All database tables
2. `EMAIL_AUTOMATION_SYSTEM.md` - Complete system documentation

### Action Required:
```bash
# Run in Supabase SQL Editor
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run: CREATE_EMAIL_AUTOMATION_TABLES.sql
4. Verify 5 tables created:
   - cold_outreach_email_queue
   - cold_outreach_sending_schedule
   - cold_outreach_campaign_automation
   - cold_outreach_email_responses
   - cold_outreach_email_log
```

---

## Phase 2: OAuth Integration (REQUIRED BEFORE SENDING)

### Gmail Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or use existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-domain.com/api/auth/gmail/callback`
6. Required scopes:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.readonly`

### Outlook Setup
1. Go to [Azure Portal](https://portal.azure.com)
2. Register new application
3. Add Microsoft Graph API permissions:
   - `Mail.Send`
   - `Mail.Read`
4. Add redirect URI: `https://your-domain.com/api/auth/outlook/callback`

### Store Credentials
Add to `.env.local`:
```env
GMAIL_CLIENT_ID=xxx
GMAIL_CLIENT_SECRET=xxx
OUTLOOK_CLIENT_ID=xxx
OUTLOOK_CLIENT_SECRET=xxx
CRON_SECRET=generate-random-secret-here
```

---

## Phase 3: Core API Endpoints (TO BE BUILT)

### Priority 1: Campaign Start/Stop
```typescript
// app/api/campaigns/start/route.ts
POST /api/campaigns/start
- Validates user has OAuth connected
- Creates email queue entries
- Calculates send times (28/day, 9am-5pm, no weekends)
- Links follow-ups (3-day delay)
- Returns: { queued: number, first_send: timestamp }

// app/api/campaigns/stop/route.ts
POST /api/campaigns/stop
- Cancels all pending emails for campaign
- Updates status to 'cancelled'
- Returns: { cancelled: number }
```

### Priority 2: Email Sending Cron
```typescript
// app/api/cron/send-emails/route.ts
POST /api/cron/send-emails
- Runs every 5 minutes (Vercel Cron)
- Finds emails scheduled for next 5 minutes
- Checks rate limit (28/day)
- Sends via Gmail/Outlook API
- Updates queue status
- Logs all events
```

### Priority 3: Response Checking Cron
```typescript
// app/api/cron/check-responses/route.ts
POST /api/cron/check-responses
- Runs every 15 minutes
- Checks Gmail/Outlook for new messages
- Matches thread_id to sent emails
- If match: cancels follow-ups for that campaign
- Logs response event
```

### Priority 4: Status Dashboard
```typescript
// app/api/campaigns/status/route.ts
GET /api/campaigns/status?campaignId=xxx
- Returns campaign progress
- Shows sent/pending/failed counts
- Lists upcoming sends
- Shows response rate
```

---

## Phase 4: UI Components (TO BE BUILT)

### 1. OAuth Connection Page
```
/settings/email-connection
- Connect Gmail button
- Connect Outlook button
- Show connection status
- Test send button
```

### 2. Campaign Controls
```
/email-campaigns (update existing)
- "Start Campaign" button per campaign
- "Stop Campaign" button
- Status indicator (running/stopped/completed)
- Progress bar
```

### 3. Automation Dashboard
```
/automation-dashboard (new page)
- Today's sending stats (X/28 sent)
- Next email scheduled at: HH:MM
- Upcoming schedule (next 10 emails)
- Response tracking stats
- Recent responses list
- Failed emails list
```

### 4. Settings Page
```
/settings/automation (new page)
- Max emails per day (default: 28)
- Sending hours (default: 9am-5pm)
- Follow-up delay (default: 3 days)
- Skip weekends (default: true)
- Timezone (default: Europe/London)
```

---

## Phase 5: Cron Job Setup

### Option A: Vercel Cron (Recommended)
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/send-emails",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/check-responses",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

### Option B: External Cron Service
- Use cron-job.org or similar
- Call endpoints with CRON_SECRET header
- More reliable for critical operations

---

## Phase 6: Testing Protocol

### Unit Tests
- [ ] Rate limiting logic
- [ ] Business day calculation
- [ ] Follow-up scheduling
- [ ] Response matching

### Integration Tests
- [ ] Send 1 email, verify it sends
- [ ] Send 30 emails, verify only 28 send today
- [ ] Reply to email, verify follow-ups cancelled
- [ ] Test weekend skip logic
- [ ] Test 3-day follow-up delay

### Load Tests
- [ ] 100 email campaign
- [ ] Multiple campaigns simultaneously
- [ ] Response detection under load

### Edge Case Tests
- [ ] Response before follow-up scheduled
- [ ] Response after follow-up scheduled but before sent
- [ ] Same email in multiple campaigns
- [ ] Campaign stopped mid-send
- [ ] OAuth token expired during send

---

## Phase 7: Monitoring & Alerts

### Metrics to Track
1. Emails sent per day
2. Success rate
3. Response rate
4. Failed sends
5. API errors
6. Cron job execution time

### Alerts to Set Up
1. Email send failure rate > 5%
2. Cron job hasn't run in 30 minutes
3. OAuth token expired
4. Rate limit exceeded
5. Database errors

### Tools
- Sentry for error tracking
- Vercel Analytics for performance
- Custom dashboard for email metrics

---

## Estimated Timeline

### Minimal Viable Product (MVP)
- **Week 1:** OAuth setup + Database
- **Week 2:** Core sending logic + Cron jobs
- **Week 3:** Response tracking + UI
- **Week 4:** Testing + Bug fixes
- **Total:** 4 weeks for basic functionality

### Production Ready
- **Week 5-6:** Advanced features (retry logic, better error handling)
- **Week 7:** Load testing + Optimization
- **Week 8:** Monitoring + Documentation
- **Total:** 8 weeks for production-ready system

---

## Cost Estimate

### Development
- 4-8 weeks of development time
- OAuth setup: 1-2 days
- Testing: 1-2 weeks

### Ongoing Costs
- Gmail API: Free (up to 1B requests/day)
- Outlook API: Included with Microsoft 365
- Supabase: ~$25/month (Pro plan recommended)
- Vercel: ~$20/month (Pro plan for cron jobs)
- **Total:** ~$45/month

---

## Risk Assessment

### High Risk
1. **Response detection accuracy**
   - Mitigation: Thorough testing with real emails
   - Fallback: Manual review dashboard

2. **Rate limiting precision**
   - Mitigation: Database-level atomic operations
   - Fallback: Conservative limits (25/day instead of 28)

3. **OAuth token expiration**
   - Mitigation: Automatic refresh logic
   - Fallback: Email alert to reconnect

### Medium Risk
1. **Weekend/holiday detection**
   - Mitigation: Use reliable timezone library
   - Fallback: Manual calendar override

2. **Email deliverability**
   - Mitigation: Warm up sending gradually
   - Fallback: Monitor bounce rates

### Low Risk
1. **Database performance**
   - Mitigation: Proper indexing
   - Fallback: Query optimization

---

## Decision Points

### Before Starting Implementation:

1. **Do you have time for 4-8 weeks of development?**
   - Yes → Proceed with implementation
   - No → Consider third-party service (Mailchimp, SendGrid)

2. **Do you have budget for testing?**
   - Need test email accounts
   - Need time to test thoroughly
   - Mistakes could damage client relationships

3. **Do you have OAuth expertise?**
   - Gmail/Outlook APIs are complex
   - Token refresh logic is critical
   - Consider hiring specialist if needed

4. **Can you monitor the system daily?**
   - First month requires close monitoring
   - Need to catch issues quickly
   - Need to respond to failures

---

## Recommendation

Given the complexity and "lots of money at stake":

### Option 1: Full Custom Build (Current Plan)
**Pros:**
- Complete control
- No per-email costs
- Custom logic for your needs

**Cons:**
- 4-8 weeks development
- Ongoing maintenance
- High risk if bugs occur

### Option 2: Hybrid Approach (RECOMMENDED)
**Use existing service for sending:**
- SendGrid, Mailgun, or Postmark for actual sending
- Build custom logic for scheduling and response tracking
- Reduces risk of delivery issues
- Faster to implement (2-3 weeks)

**Pros:**
- Reliable email delivery
- Built-in bounce handling
- Faster implementation
- Lower risk

**Cons:**
- Per-email costs (~$0.001/email)
- Less control over sending

### Option 3: Full Third-Party
**Use Mailchimp or similar:**
- Built-in automation
- Response tracking
- Proven reliability

**Pros:**
- Immediate availability
- No development needed
- Proven at scale

**Cons:**
- Monthly costs ($50-200/month)
- Less customization
- May not fit exact requirements

---

## Next Immediate Steps

1. **Review this document thoroughly**
2. **Decide on implementation approach**
3. **If proceeding with custom build:**
   - Run `CREATE_EMAIL_AUTOMATION_TABLES.sql`
   - Set up OAuth credentials
   - Start with Phase 3 (API endpoints)
4. **If considering alternatives:**
   - Research SendGrid/Mailgun integration
   - Compare costs vs. development time
   - Evaluate risk tolerance

---

## Questions to Answer Before Proceeding

1. What's your timeline? (Urgent vs. can wait 2 months)
2. What's your budget? (Development time vs. service costs)
3. What's your risk tolerance? (Custom vs. proven service)
4. Do you have OAuth/API experience?
5. Can you dedicate time to testing?
6. Do you have monitoring infrastructure?

**Once these are answered, we can proceed with the appropriate approach.**
