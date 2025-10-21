# Email Automation System - Cold Outreach

## Overview
Automated email campaign system with intelligent scheduling, rate limiting, and response tracking.

---

## Key Features

### 1. **Rate Limiting**
- Maximum 28 emails per day
- Spread evenly between 9am - 5pm London time
- Approximately 1 email every 20 minutes during business hours

### 2. **Smart Scheduling**
- Monday to Friday only (no weekends)
- Automatic queue management
- If 100 emails in campaign: Day 1 sends 28, Day 2 sends 28, Day 3 sends 28, Day 4 sends 16

### 3. **Follow-Up Logic**
- 3-day delay between emails
- Email #1 → wait 3 business days → Email #2 → wait 3 business days → Email #3
- Weekends don't count (Friday email → Monday is day 1, Tuesday is day 2, Wednesday is day 3)

### 4. **Response Tracking**
- Integrates with Gmail/Outlook APIs
- Detects replies to sent emails
- Automatically cancels follow-ups if response received
- Per-campaign tracking (same email in different campaigns = separate tracking)

---

## Database Tables

### `cold_outreach_email_queue`
**Purpose:** Tracks every email to be sent

**Key Fields:**
- `scheduled_for` - When to send this email
- `status` - pending, sending, sent, failed, cancelled, response_received
- `follow_up_number` - 1, 2, or 3
- `parent_email_id` - Links to previous email in sequence
- `response_detected_at` - When reply was received

### `cold_outreach_sending_schedule`
**Purpose:** Daily rate limiting tracker

**Key Fields:**
- `send_date` - The date
- `emails_sent_today` - Counter (max 28)
- `max_emails_per_day` - Configurable limit
- `sending_start_hour` - 9 (9am)
- `sending_end_hour` - 17 (5pm)

### `cold_outreach_campaign_automation`
**Purpose:** User automation settings

**Key Fields:**
- `is_active` - Master on/off switch
- `follow_up_delay_days` - 3 days default
- `skip_weekends` - true
- `gmail_connected` - OAuth status
- `outlook_connected` - OAuth status

### `cold_outreach_email_responses`
**Purpose:** Tracks replies from recipients

**Key Fields:**
- `from_email` - Who replied
- `campaign_id` - Which campaign
- `thread_id` - Email thread identifier
- `cancelled_follow_ups` - Whether follow-ups were stopped

### `cold_outreach_email_log`
**Purpose:** Audit trail of all events

**Events:**
- scheduled, sent, failed, cancelled, response_received, follow_up_cancelled

---

## How It Works

### Starting a Campaign

1. **User clicks "Start Campaign"**
   - System checks if automation is active
   - Validates OAuth connection (Gmail/Outlook)

2. **Queue Generation**
   - For each enabled template (1, 2, 3):
     - Creates queue entry for each contact
     - Calculates send times based on rate limit
     - Links follow-ups to parent emails

3. **Scheduling Algorithm**
   ```
   Day 1 (Monday 9am): Start sending Email #1 batch
   - 9:00am - Email 1
   - 9:20am - Email 2
   - 9:40am - Email 3
   ... (28 emails spread across 9am-5pm)
   
   Day 2 (Tuesday 9am): Continue Email #1 batch
   - Next 28 emails
   
   Day 5 (Friday): Email #1 batch complete
   
   Day 8 (Wednesday): Start Email #2 (follow-up)
   - 3 business days after first Email #1 was sent
   - Only send to contacts who didn't respond
   
   Day 11 (Monday): Start Email #3 (final follow-up)
   - 3 business days after first Email #2 was sent
   - Only send to contacts who didn't respond
   ```

### Response Detection

**Every 15 minutes:**
1. Check Gmail/Outlook API for new messages
2. Match message thread_id to sent emails
3. If match found:
   - Mark email as `response_received`
   - Cancel all pending follow-ups for that contact in that campaign
   - Log the event
   - Update campaign status

**Important:** Only cancels follow-ups for the specific campaign, not all campaigns with that email.

### Rate Limiting Logic

```javascript
// Calculate next available send time
function getNextSendTime(userId, date) {
  // Get today's schedule
  const schedule = getSchedule(userId, date);
  
  // Check if limit reached
  if (schedule.emails_sent_today >= 28) {
    // Move to next business day
    return getNextBusinessDay(date, '09:00');
  }
  
  // Calculate time slot
  const emailsToday = schedule.emails_sent_today;
  const totalSlots = 28;
  const workingHours = 8; // 9am to 5pm
  const minutesPerEmail = (workingHours * 60) / totalSlots; // ~17 minutes
  
  const startTime = setHour(date, 9); // 9am
  const nextSlot = addMinutes(startTime, emailsToday * minutesPerEmail);
  
  return nextSlot;
}

function getNextBusinessDay(date, time) {
  let next = addDays(date, 1);
  
  // Skip weekends
  while (isWeekend(next)) {
    next = addDays(next, 1);
  }
  
  return setTime(next, time);
}
```

---

## API Endpoints Needed

### 1. Start Campaign
```
POST /api/campaigns/start
Body: { campaignIds: string[] }
Response: { queued: number, scheduled_start: timestamp }
```

### 2. Stop Campaign
```
POST /api/campaigns/stop
Body: { campaignIds: string[] }
Response: { cancelled: number }
```

### 3. Check Status
```
GET /api/campaigns/status?campaignId=xxx
Response: {
  total: number,
  sent: number,
  pending: number,
  failed: number,
  responses: number,
  next_send: timestamp
}
```

### 4. Process Email Queue (Cron Job)
```
POST /api/cron/send-emails
Headers: { Authorization: "Bearer CRON_SECRET" }
```
- Runs every 5 minutes
- Checks for emails scheduled in next 5 minutes
- Sends via Gmail/Outlook API
- Updates queue status

### 5. Check Responses (Cron Job)
```
POST /api/cron/check-responses
Headers: { Authorization: "Bearer CRON_SECRET" }
```
- Runs every 15 minutes
- Checks Gmail/Outlook for replies
- Cancels follow-ups if response found

---

## OAuth Setup Required

### Gmail API
1. Enable Gmail API in Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add scopes:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.readonly`
4. Store refresh token in `cold_outreach_campaign_automation`

### Outlook API
1. Register app in Azure AD
2. Add Microsoft Graph permissions:
   - `Mail.Send`
   - `Mail.Read`
3. Store refresh token in `cold_outreach_campaign_automation`

---

## Safety Features

### 1. **Duplicate Prevention**
- Unique constraint on `(campaign_id, follow_up_number)`
- Prevents sending same email twice

### 2. **Response Detection**
- Checks thread_id and in_reply_to headers
- Matches against sent email message_ids
- Only cancels follow-ups for specific campaign

### 3. **Rate Limit Enforcement**
- Database-level tracking
- Atomic increment operations
- Cannot exceed 28/day even with concurrent requests

### 4. **Weekend Skip**
- Scheduler automatically skips Saturday/Sunday
- Follow-up delays count business days only

### 5. **Error Handling**
- Failed sends retry 3 times
- After 3 failures, mark as failed and alert user
- Log all errors for debugging

---

## Testing Checklist

### Rate Limiting
- [ ] Verify exactly 28 emails sent per day
- [ ] Verify emails spread between 9am-5pm
- [ ] Verify no emails sent on weekends
- [ ] Verify queue moves to next day when limit reached

### Follow-Up Logic
- [ ] Verify 3-day delay between emails
- [ ] Verify weekends don't count in delay
- [ ] Verify follow-ups link to parent emails
- [ ] Verify follow-up #2 only sent if #1 was sent

### Response Tracking
- [ ] Send test email, reply to it
- [ ] Verify response detected within 15 minutes
- [ ] Verify follow-ups cancelled for that contact
- [ ] Verify other campaigns to same email still send
- [ ] Verify different contacts in same campaign still send

### Edge Cases
- [ ] Campaign with 1 email (should send immediately)
- [ ] Campaign with 100 emails (should take 4 days)
- [ ] Response received before follow-up scheduled
- [ ] Response received after follow-up scheduled but before sent
- [ ] Multiple responses from same contact
- [ ] Same email in multiple campaigns

---

## Monitoring Dashboard

### Metrics to Display
1. **Today's Stats**
   - Emails sent today: X / 28
   - Next email at: HH:MM
   - Responses received: X

2. **Campaign Progress**
   - Total queued: X
   - Sent: X
   - Pending: X
   - Failed: X
   - Response rate: X%

3. **Upcoming Schedule**
   - Next 5 emails with times
   - Follow-ups scheduled for next 7 days

4. **Response Tracking**
   - Recent responses (last 24h)
   - Follow-ups cancelled: X

---

## Environment Variables Needed

```env
# Gmail OAuth
GMAIL_CLIENT_ID=xxx
GMAIL_CLIENT_SECRET=xxx

# Outlook OAuth
OUTLOOK_CLIENT_ID=xxx
OUTLOOK_CLIENT_SECRET=xxx

# Cron Security
CRON_SECRET=xxx

# Timezone
TZ=Europe/London
```

---

## Next Steps

1. **Run SQL:** `CREATE_EMAIL_AUTOMATION_TABLES.sql`
2. **Set up OAuth:** Gmail and Outlook apps
3. **Create API endpoints:** Start/stop campaigns, cron jobs
4. **Set up cron jobs:** Vercel Cron or external service
5. **Build UI:** Campaign controls and monitoring dashboard
6. **Test thoroughly:** All scenarios in checklist
7. **Deploy:** With monitoring and alerts

---

## Cost Considerations

- Gmail API: Free up to 1 billion requests/day
- Outlook API: Included with Microsoft 365
- Supabase: Database queries (should be minimal)
- Vercel Cron: Free tier includes cron jobs

**Estimated cost:** $0/month for up to 10,000 emails/month

---

## Support & Troubleshooting

### Email not sending?
1. Check `cold_outreach_email_queue` status
2. Check `cold_outreach_email_log` for errors
3. Verify OAuth tokens are valid
4. Check rate limit not exceeded

### Follow-ups still sending after response?
1. Check `cold_outreach_email_responses` table
2. Verify thread_id matching logic
3. Check cron job is running every 15 minutes
4. Verify `cancelled_follow_ups` flag is set

### Emails sending on weekends?
1. Check `skip_weekends` setting
2. Verify timezone is correct (Europe/London)
3. Check scheduler logic for weekend detection

---

This system is designed for precision and reliability. Every email is tracked, every response is detected, and every follow-up is intelligently managed.
