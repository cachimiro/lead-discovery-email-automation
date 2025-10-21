# 🧪 BULLETPROOF TESTING GUIDE

## Complete Testing Strategy for Email Automation System

**Purpose:** Ensure zero data loss, zero rate limit violations, and 99.9% reliability

---

## 📋 PRE-LAUNCH TESTING CHECKLIST

### Phase 1: Unit Tests ✅

#### Rate Limiting Logic
- [ ] Test slot reservation with 28 emails/day limit
- [ ] Test concurrent slot reservations (race conditions)
- [ ] Test slot reservation across multiple days
- [ ] Test weekend skipping logic
- [ ] Test business day calculations
- [ ] Test time window enforcement (9am-5pm)

#### Follow-Up Scheduling
- [ ] Test 3-day delay calculation
- [ ] Test weekend skipping in follow-ups
- [ ] Test follow-up cancellation on response
- [ ] Test multiple follow-up sequences (1→2→3)
- [ ] Test follow-up scheduling across month boundaries

#### Error Handling
- [ ] Test error classification (transient, rate limit, etc.)
- [ ] Test retry logic with exponential backoff
- [ ] Test dead letter queue insertion
- [ ] Test campaign pause on high failure rate
- [ ] Test alert generation

#### Response Matching
- [ ] Test thread ID matching
- [ ] Test In-Reply-To header matching
- [ ] Test fuzzy subject matching
- [ ] Test recipient email matching
- [ ] Test duplicate response prevention

---

### Phase 2: Integration Tests ✅

#### Database Operations
```bash
# Test atomic slot reservation
curl -X POST http://localhost:3000/api/email-automation/start-campaign \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "test-campaign-id",
    "maxEmailsPerDay": 28
  }'

# Verify no duplicates created
# Verify rate limit enforced
# Verify transaction rollback on error
```

#### SendGrid Integration
```bash
# Test email sending
# Test webhook signature verification
# Test inbound parse processing
# Test bounce handling
# Test delivery tracking
```

#### API Endpoints
```bash
# Test start campaign
curl -X POST http://localhost:3000/api/email-automation/start-campaign

# Test stop campaign
curl -X POST http://localhost:3000/api/email-automation/stop-campaign

# Test send batch (cron)
curl -X POST http://localhost:3000/api/email-automation/send-batch \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test webhook
curl -X POST http://localhost:3000/api/email-automation/webhook-response

# Test stats
curl http://localhost:3000/api/email-automation/stats?campaignId=xxx

# Test health check
curl http://localhost:3000/api/email-automation/health
```

---

### Phase 3: Load Tests ✅

#### Concurrent Campaign Starts
```javascript
// Test 10 users starting campaigns simultaneously
const promises = [];
for (let i = 0; i < 10; i++) {
  promises.push(
    fetch('/api/email-automation/start-campaign', {
      method: 'POST',
      body: JSON.stringify({ campaignId: `campaign-${i}` })
    })
  );
}
await Promise.all(promises);

// Verify:
// - No duplicate emails created
// - Rate limits respected per user
// - All campaigns started successfully
```

#### High Volume Email Queue
```javascript
// Queue 1000 emails
// Verify:
// - All emails scheduled correctly
// - Rate limiting works across days
// - No database deadlocks
// - Query performance acceptable (< 100ms)
```

#### Webhook Flood
```javascript
// Send 100 webhook events simultaneously
// Verify:
// - All responses processed
// - No duplicate processing
// - Follow-ups cancelled correctly
// - No database locks
```

---

### Phase 4: Chaos Engineering ✅

#### Scenario 1: SendGrid API Down
```javascript
// Simulate SendGrid returning 503 errors
// Expected behavior:
// - Emails marked as 'failed'
// - Retry logic kicks in
// - Emails moved to DLQ after max retries
// - Alerts sent
// - Campaign NOT paused (transient error)
```

#### Scenario 2: Database Connection Lost
```javascript
// Disconnect database mid-transaction
// Expected behavior:
// - Transaction rolled back
// - No partial data written
// - Error logged
// - Retry attempted
// - Alert sent
```

#### Scenario 3: Webhook Endpoint Unreachable
```javascript
// Make webhook endpoint return 500
// Expected behavior:
// - Response logged but not processed
// - Fallback polling catches response
// - Follow-ups still cancelled
// - No data loss
```

#### Scenario 4: Cron Job Crashes Mid-Execution
```javascript
// Kill cron job process while sending emails
// Expected behavior:
// - Emails in 'sending' status reset to 'pending'
// - Next cron run picks them up
// - No duplicate sends
// - No emails lost
```

#### Scenario 5: Rate Limit Exceeded
```javascript
// Manually set emails_sent_today to 28
// Try to send one more email
// Expected behavior:
// - Email NOT sent
// - Moved to next day
// - Rate limit constraint enforced
// - Alert sent
```

---

### Phase 5: Production Dry Run ✅

#### Step 1: Create Test Campaign
```sql
-- Create test campaign with 10 internal email addresses
INSERT INTO cold_outreach_email_campaigns (user_id, name, status)
VALUES ('your-user-id', 'Test Campaign - DO NOT DELETE', 'draft');

-- Add 10 test contacts (use your own email addresses)
INSERT INTO cold_outreach_contacts (user_id, campaign_id, email, first_name)
VALUES 
  ('your-user-id', 'campaign-id', 'test1@yourdomain.com', 'Test 1'),
  ('your-user-id', 'campaign-id', 'test2@yourdomain.com', 'Test 2'),
  -- ... add 8 more
```

#### Step 2: Start Campaign
```bash
curl -X POST http://localhost:3000/api/email-automation/start-campaign \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "your-test-campaign-id",
    "maxEmailsPerDay": 10,
    "followUpDelayDays": 1,
    "skipWeekends": false
  }'
```

#### Step 3: Monitor Sending
```bash
# Check queue status
curl http://localhost:3000/api/email-automation/stats?campaignId=xxx

# Check health
curl http://localhost:3000/api/email-automation/health

# Watch logs
tail -f /var/log/email-automation.log
```

#### Step 4: Test Response Detection
```
1. Reply to one of the test emails
2. Wait 1 minute
3. Check if follow-ups were cancelled:

curl http://localhost:3000/api/email-automation/stats?campaignId=xxx
# Should show follow-ups cancelled
```

#### Step 5: Verify Rate Limiting
```sql
-- Check sending schedule
SELECT * FROM cold_outreach_sending_schedule 
WHERE user_id = 'your-user-id' 
AND send_date = CURRENT_DATE;

-- Should show:
-- emails_sent_today = 10
-- max_emails_per_day = 10
```

#### Step 6: Check Audit Trail
```sql
-- Verify all events logged
SELECT event_type, message, created_at 
FROM cold_outreach_email_log 
WHERE campaign_id = 'your-test-campaign-id'
ORDER BY created_at DESC;

-- Should see:
-- - scheduled events
-- - sent events
-- - response_received events
-- - follow_up_cancelled events
```

---

## 🎯 ACCEPTANCE CRITERIA

### Must Pass Before Production Launch

#### Reliability
- [ ] 100% of test emails sent successfully
- [ ] 0 duplicate emails sent
- [ ] 0 rate limit violations
- [ ] 0 data loss incidents
- [ ] 100% of responses detected within 5 minutes

#### Performance
- [ ] Campaign start < 5 seconds for 100 contacts
- [ ] Email send < 2 seconds per email
- [ ] Webhook processing < 1 second
- [ ] Database queries < 100ms average
- [ ] Health check < 500ms

#### Error Handling
- [ ] All errors logged to database
- [ ] Failed emails moved to DLQ after 3 retries
- [ ] Alerts sent for critical errors
- [ ] Campaign paused on 10%+ failure rate
- [ ] System recovers from all chaos scenarios

#### Audit Trail
- [ ] Every email logged (scheduled, sent, failed)
- [ ] Every response logged
- [ ] Every follow-up cancellation logged
- [ ] Every error logged with stack trace
- [ ] Logs queryable by user, campaign, date

---

## 🔍 MANUAL TESTING CHECKLIST

### Day 1: Basic Flow
- [ ] Create campaign with 5 contacts
- [ ] Add 3 email templates
- [ ] Start campaign
- [ ] Verify emails scheduled correctly
- [ ] Wait for first email to send
- [ ] Verify email received
- [ ] Reply to email
- [ ] Verify follow-ups cancelled

### Day 2: Rate Limiting
- [ ] Create campaign with 50 contacts
- [ ] Set max 10 emails/day
- [ ] Start campaign
- [ ] Verify only 10 sent on day 1
- [ ] Verify next 10 sent on day 2
- [ ] Verify rate limit never exceeded

### Day 3: Error Handling
- [ ] Temporarily break SendGrid API key
- [ ] Trigger email send
- [ ] Verify retry logic works
- [ ] Verify email moved to DLQ
- [ ] Verify alert sent
- [ ] Fix API key
- [ ] Manually resend from DLQ

### Day 4: Follow-Ups
- [ ] Create campaign with 3 templates
- [ ] Send to 5 contacts
- [ ] Don't reply to any
- [ ] Verify email #2 sent after 3 days
- [ ] Verify email #3 sent after 6 days
- [ ] Reply to one email
- [ ] Verify only that recipient's follow-ups cancelled

### Day 5: Monitoring
- [ ] Check health endpoint
- [ ] Review daily report
- [ ] Check all metrics accurate
- [ ] Verify alerts working
- [ ] Test Slack notifications (if configured)

---

## 📊 PERFORMANCE BENCHMARKS

### Target Metrics
| Metric | Target | Acceptable | Unacceptable |
|--------|--------|------------|--------------|
| Email send time | < 1s | < 2s | > 3s |
| Campaign start | < 3s | < 5s | > 10s |
| Webhook processing | < 500ms | < 1s | > 2s |
| Database query | < 50ms | < 100ms | > 200ms |
| Health check | < 200ms | < 500ms | > 1s |
| Response detection | < 1min | < 5min | > 10min |

### Load Targets
| Scenario | Target | Notes |
|----------|--------|-------|
| Concurrent users | 100 | Starting campaigns simultaneously |
| Emails in queue | 10,000 | Without performance degradation |
| Emails per minute | 60 | Sustained rate |
| Webhooks per minute | 100 | Burst handling |
| Database connections | 50 | Connection pool size |

---

## 🚨 FAILURE SCENARIOS TO TEST

### Critical Failures (Must Handle Gracefully)
1. **SendGrid API completely down**
   - System should queue emails and retry
   - Alerts sent immediately
   - No data loss

2. **Database connection lost**
   - Transactions rolled back
   - Automatic reconnection
   - No partial writes

3. **Cron job doesn't run for 24 hours**
   - Emails queued up
   - System catches up when cron resumes
   - No duplicates sent

4. **Webhook endpoint DDoS'd**
   - Rate limiting protects system
   - Legitimate webhooks still processed
   - Fallback polling works

5. **User exceeds rate limit**
   - Hard constraint prevents sending
   - Email moved to next day
   - User notified

### Edge Cases
1. **Campaign started at 11:59 PM**
   - Emails scheduled for next day
   - Rate limiting works correctly

2. **Response received before email marked 'sent'**
   - Response still matched
   - Follow-ups still cancelled

3. **Two responses from same recipient**
   - Only first response processed
   - No duplicate cancellations

4. **Campaign stopped mid-send**
   - In-flight emails complete
   - Pending emails cancelled
   - No orphaned emails

5. **User deletes campaign**
   - All emails cancelled
   - Audit trail preserved
   - No foreign key errors

---

## 📝 TEST DATA SETUP

### SQL Script for Test Data
```sql
-- Create test user
INSERT INTO users (id, email) 
VALUES ('test-user-id', 'test@example.com');

-- Create test campaign
INSERT INTO cold_outreach_email_campaigns (id, user_id, name, status)
VALUES ('test-campaign-id', 'test-user-id', 'Test Campaign', 'draft');

-- Create test templates
INSERT INTO cold_outreach_email_templates (user_id, template_number, subject, body, is_enabled)
VALUES 
  ('test-user-id', 1, 'Test Email #1', 'Hello {{first_name}}', true),
  ('test-user-id', 2, 'Test Follow-up #1', 'Following up...', true),
  ('test-user-id', 3, 'Test Follow-up #2', 'Final follow-up...', true);

-- Create test contacts
INSERT INTO cold_outreach_contacts (user_id, campaign_id, email, first_name)
SELECT 
  'test-user-id',
  'test-campaign-id',
  'test' || generate_series || '@example.com',
  'Test ' || generate_series
FROM generate_series(1, 10);
```

---

## ✅ SIGN-OFF CHECKLIST

Before deploying to production, all stakeholders must sign off:

### Technical Lead
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Load tests completed successfully
- [ ] Chaos engineering scenarios handled
- [ ] Performance benchmarks met
- [ ] Code reviewed and approved

### QA Engineer
- [ ] Manual testing completed
- [ ] All acceptance criteria met
- [ ] Edge cases tested
- [ ] Error handling verified
- [ ] Audit trail complete

### Product Owner
- [ ] Dry run completed successfully
- [ ] Business requirements met
- [ ] User experience acceptable
- [ ] Monitoring in place
- [ ] Rollback plan documented

### Security Engineer
- [ ] Webhook signatures verified
- [ ] API authentication working
- [ ] Rate limiting enforced
- [ ] Data encryption confirmed
- [ ] No secrets in logs

---

## 🎉 READY FOR PRODUCTION

Once all tests pass and all stakeholders sign off:

1. Deploy to production
2. Start with 1 small test campaign
3. Monitor for 48 hours
4. Gradually increase volume
5. Full rollout after 1 week of stable operation

**Remember: It's better to delay launch than to launch with bugs. This system handles money-critical operations.**

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-20  
**Status:** Ready for Testing
