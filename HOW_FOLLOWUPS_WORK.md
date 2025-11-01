# How Follow-Ups Work

## Overview

The email automation system sends follow-up emails automatically based on your campaign configuration. Follow-ups are only sent if the recipient hasn't responded to previous emails.

## Follow-Up Scheduling

### When Campaign Starts

When you start a campaign, the system:

1. **Schedules Initial Emails (Stage 1)**
   - One email per contact in your selected pools
   - Scheduled based on rate limits (default: 28 emails/day)
   - Spread throughout business hours (9am-5pm)
   - Respects weekends if configured

2. **Pre-Schedules Follow-Ups (Stage 2 & 3)**
   - **Only if you enabled them** when creating the campaign
   - Follow-up #1 (Stage 2): Scheduled 3 business days after initial email
   - Follow-up #2 (Stage 3): Scheduled 6 business days after initial email (3 days after follow-up #1)
   - All follow-ups are pre-scheduled with status: `pending`

### Example Timeline

```
Day 1:  Initial email sent to contact@example.com
        ↓
Day 4:  Follow-up #1 scheduled (if no response)
        ↓
Day 7:  Follow-up #2 scheduled (if no response)
```

## Automatic Follow-Up Cancellation

### When Recipient Responds

The system automatically cancels all pending follow-ups when:

1. **Recipient replies to any email** in the campaign
2. **Webhook receives the response** (via SendGrid Inbound Parse or Gmail/Microsoft API)
3. **System identifies the original campaign** by matching:
   - Email thread ID (In-Reply-To header)
   - Recipient email address
   - Subject line similarity
   - Campaign ID

4. **All pending follow-ups are cancelled** for that recipient
   - Status changed from `pending` to `cancelled`
   - Logged in email_log table
   - Response recorded in email_responses table

### What Gets Cancelled

When a response is received:
- ✅ All **pending** follow-ups for that recipient
- ✅ All **scheduled** follow-ups for that recipient
- ❌ Already **sent** emails (cannot be unsent)
- ❌ Follow-ups for **other recipients** (unaffected)

## Current Implementation

### Email Queue Status Flow

```
pending → sending → sent
   ↓         ↓        ↓
cancelled  failed   response_received
```

### Follow-Up Logic

1. **Cron Job Runs Every 5 Minutes**
   - Checks for emails with status: `pending`
   - Checks if scheduled_for time has passed
   - Sends emails via OAuth (Gmail/Microsoft API)

2. **Before Sending Follow-Up**
   - System checks if parent email received a response
   - If response exists, follow-up is automatically cancelled
   - If no response, follow-up is sent

3. **Response Detection**
   - Webhook endpoint: `/api/email-automation/webhook-response`
   - Processes incoming replies
   - Matches to original campaign
   - Cancels pending follow-ups atomically

## Database Functions

### `cancel_follow_ups_for_recipient`

Atomic database function that:
- Finds all pending follow-ups for a recipient in a campaign
- Updates their status to `cancelled`
- Returns count of cancelled emails
- Ensures no race conditions

```sql
UPDATE cold_outreach_email_queue
SET status = 'cancelled',
    updated_at = NOW()
WHERE campaign_id = p_campaign_id
  AND recipient_email = p_recipient_email
  AND status = 'pending'
  AND is_follow_up = true
RETURNING id;
```

## How to Configure Follow-Ups

### When Creating Campaign

1. **Initial Email (Required)**
   - Always enabled
   - Stage 1 template

2. **Follow-Up #1 (Optional)**
   - Click "Add Follow-up #1"
   - Write subject and body
   - Sent 3 business days after initial

3. **Follow-Up #2 (Optional)**
   - Click "Add Follow-up #2"
   - Write subject and body
   - Sent 3 business days after follow-up #1

### Campaign Settings

When starting a campaign, you can configure:
- **Max Emails Per Day**: Default 28 (to stay under Gmail limits)
- **Sending Hours**: Default 9am-5pm
- **Follow-Up Delay**: Default 3 business days
- **Skip Weekends**: Default enabled

## Monitoring Follow-Ups

### Campaign Dashboard

View real-time stats:
- **Stage 1, 2, 3 Counts**: How many emails in each stage
- **Pending**: Emails waiting to be sent
- **Sent**: Emails successfully delivered
- **Responses**: Replies received
- **Cancelled**: Follow-ups cancelled due to responses

### Email Queue

Check status of individual emails:
```sql
SELECT 
  recipient_email,
  is_follow_up,
  follow_up_number,
  status,
  scheduled_for,
  sent_at
FROM cold_outreach_email_queue
WHERE campaign_id = 'your-campaign-id'
ORDER BY recipient_email, follow_up_number;
```

### Response Log

See which responses cancelled follow-ups:
```sql
SELECT 
  r.from_email,
  r.received_at,
  r.cancelled_follow_ups,
  r.follow_ups_cancelled_count
FROM cold_outreach_email_responses r
WHERE r.campaign_id = 'your-campaign-id'
  AND r.cancelled_follow_ups = true;
```

## Best Practices

### 1. **Write Valuable Follow-Ups**
- Don't just say "following up"
- Add new value or information
- Reference the previous email
- Keep it brief and respectful

### 2. **Timing**
- 3 business days is a good default
- Adjust based on your industry
- Don't send too many too quickly
- Respect recipient's time

### 3. **Limit Follow-Ups**
- 2-3 follow-ups maximum
- More than that is spam
- If no response after 3 emails, move on

### 4. **Monitor Responses**
- Check response rate regularly
- If low, improve your messaging
- If high negative responses, stop campaign

### 5. **Respect Unsubscribes**
- System automatically stops follow-ups on response
- Manually mark contacts as "do not contact" if requested
- Remove from pools if they opt out

## Technical Details

### Email Queue Schema

```typescript
interface EmailQueue {
  id: string;
  user_id: string;
  campaign_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  scheduled_for: timestamp;
  sent_at?: timestamp;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled' | 'response_received';
  is_follow_up: boolean;
  follow_up_number: 1 | 2 | 3;
  parent_email_id?: string;  // Links to initial email
  contact_id: string;
  retry_count: number;
}
```

### Response Schema

```typescript
interface EmailResponse {
  id: string;
  user_id: string;
  campaign_id: string;
  email_queue_id: string;
  from_email: string;
  subject: string;
  body: string;
  received_at: timestamp;
  cancelled_follow_ups: boolean;
  follow_ups_cancelled_count: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  is_interested?: boolean;
}
```

## Troubleshooting

### Follow-Ups Not Being Sent

**Check:**
1. Campaign status is `active` (not `paused` or `draft`)
2. Follow-up templates were enabled when creating campaign
3. Scheduled time has passed
4. Email queue status is `pending` (not `cancelled`)
5. Cron job is running (check logs)

### Follow-Ups Not Being Cancelled

**Check:**
1. Webhook endpoint is configured correctly
2. Response was received and processed
3. Email thread matching worked (check logs)
4. Database function `cancel_follow_ups_for_recipient` exists
5. Response record shows `cancelled_follow_ups: true`

### Too Many Follow-Ups Sent

**Possible causes:**
1. Response webhook not configured
2. Recipient replied to different email address
3. Email thread ID not preserved
4. Response not detected by system

**Solution:**
- Manually cancel follow-ups via database
- Check webhook configuration
- Review email logs for errors

## Future Enhancements

Potential improvements:
1. **Smart Follow-Up Timing**: AI-based optimal send times
2. **A/B Testing**: Test different follow-up messages
3. **Conditional Follow-Ups**: Different messages based on behavior
4. **Follow-Up Templates**: Pre-written follow-up sequences
5. **Response Classification**: Auto-categorize responses (interested/not interested)

---

**Summary**: Follow-ups are automatically scheduled when you start a campaign and automatically cancelled when recipients respond. The system handles all the timing and logic for you, ensuring professional and respectful outreach.
