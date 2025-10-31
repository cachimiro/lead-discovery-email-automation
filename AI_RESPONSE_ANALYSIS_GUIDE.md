# AI Response Analysis System

## Overview

Your email automation system now includes **AI-powered response analysis** using OpenAI. When someone replies to your cold emails, the system automatically:

1. ✅ Detects the response
2. ✅ Cancels follow-ups
3. 🤖 **NEW:** Analyzes sentiment and intent with AI
4. 🤖 **NEW:** Categorizes the response
5. 🤖 **NEW:** Suggests next action
6. 🤖 **NEW:** Prioritizes responses that need attention

---

## How It Works

### When a Response is Received

```
1. Email reply arrives → SendGrid webhook
   ↓
2. System matches to original email
   ↓
3. AI analyzes the response (OpenAI GPT-4)
   ↓
4. Response categorized and stored
   ↓
5. Follow-ups cancelled automatically
   ↓
6. You see AI insights in dashboard
```

### AI Analysis Includes

**Sentiment Detection:**
- 😊 Positive - They're interested
- 😞 Negative - They're not interested
- 😐 Neutral - Unclear/informational
- ❓ Question - They have questions
- 🏖️ Out of Office - Auto-reply

**Category Classification:**
- `interested` - They want to learn more
- `not_interested` - They're not interested
- `needs_info` - They need more information
- `meeting_request` - They want to schedule a meeting
- `unsubscribe` - They want to opt out
- `bounce` - Email bounced
- `other` - Doesn't fit other categories

**Suggested Actions:**
- `reply_manually` - You should respond personally
- `schedule_meeting` - Set up a meeting
- `send_info` - Send additional information
- `mark_interested` - Add to interested leads
- `mark_not_interested` - Remove from campaign
- `no_action` - No action needed

**Confidence Score:**
- 0.0 to 1.0 (0% to 100%)
- Higher = AI is more confident in its analysis

---

## Setup

### 1. Database Schema

Run this in Supabase SQL Editor:

```sql
-- Apply AI response analysis schema
-- File: db/AI_RESPONSE_ANALYSIS_SCHEMA.sql
```

This adds AI analysis columns to your `cold_outreach_email_responses` table.

### 2. Environment Variable

Make sure you have OpenAI API key set in DigitalOcean:

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Get your key:**
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy and add to DigitalOcean environment variables

### 3. That's It!

The system will automatically analyze responses when they arrive. No additional configuration needed.

---

## Using the API

### Get All Responses with AI Analysis

```bash
curl https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/responses
```

### Filter by Sentiment

```bash
# Get only positive responses
curl "https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/responses?sentiment=positive"

# Get questions
curl "https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/responses?sentiment=question"
```

### Filter by Category

```bash
# Get interested leads
curl "https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/responses?category=interested"

# Get meeting requests
curl "https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/responses?category=meeting_request"
```

### Get Responses Requiring Attention

```bash
curl "https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/responses?requires_attention=true"
```

### Filter by Campaign

```bash
curl "https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/responses?campaign_id=YOUR_CAMPAIGN_ID"
```

---

## Database Queries

### View All Responses with AI Analysis

```sql
SELECT 
  from_email,
  subject,
  ai_sentiment,
  ai_category,
  ai_confidence_score,
  ai_summary,
  ai_suggested_action,
  received_at
FROM cold_outreach_email_responses
WHERE ai_sentiment IS NOT NULL
ORDER BY received_at DESC;
```

### Get Response Statistics

```sql
SELECT * FROM get_response_stats_with_ai('YOUR_USER_ID');
```

### Find High-Priority Responses

```sql
SELECT 
  from_email,
  subject,
  ai_category,
  ai_sentiment,
  ai_summary,
  ai_suggested_action
FROM cold_outreach_email_responses
WHERE 
  ai_category IN ('interested', 'meeting_request')
  OR ai_suggested_action = 'reply_manually'
ORDER BY ai_confidence_score DESC;
```

### Get Responses by Campaign with Stats

```sql
SELECT 
  campaign_name,
  COUNT(*) as total_responses,
  COUNT(*) FILTER (WHERE ai_sentiment = 'positive') as positive,
  COUNT(*) FILTER (WHERE ai_category = 'interested') as interested,
  COUNT(*) FILTER (WHERE ai_suggested_action = 'reply_manually') as needs_reply
FROM cold_outreach_response_dashboard
WHERE user_id = 'YOUR_USER_ID'
GROUP BY campaign_name;
```

---

## Example AI Analysis

### Example 1: Interested Response

**Original Email:**
```
Subject: Quick question about TechCrunch
Body: Hi Sarah, I noticed your article on AI startups...
```

**Response:**
```
Subject: Re: Quick question about TechCrunch
Body: Thanks for reaching out! I'd love to learn more about your company. 
Do you have time for a quick call next week?
```

**AI Analysis:**
```json
{
  "sentiment": "positive",
  "category": "interested",
  "confidenceScore": 0.92,
  "summary": "Recipient is interested and wants to schedule a call",
  "suggestedAction": "schedule_meeting",
  "reasoning": "Response shows clear interest with specific request for meeting"
}
```

### Example 2: Not Interested

**Response:**
```
Subject: Re: Quick question about TechCrunch
Body: Thanks but I'm not covering this topic anymore. Please remove me from your list.
```

**AI Analysis:**
```json
{
  "sentiment": "negative",
  "category": "not_interested",
  "confidenceScore": 0.95,
  "summary": "Recipient is not interested and requests removal",
  "suggestedAction": "mark_not_interested",
  "reasoning": "Clear rejection with unsubscribe request"
}
```

### Example 3: Question

**Response:**
```
Subject: Re: Quick question about TechCrunch
Body: Interesting! Can you send me more details about your product and pricing?
```

**AI Analysis:**
```json
{
  "sentiment": "question",
  "category": "needs_info",
  "confidenceScore": 0.88,
  "summary": "Recipient wants more information about product and pricing",
  "suggestedAction": "send_info",
  "reasoning": "Positive engagement with specific information request"
}
```

---

## Priority System

The AI assigns priority scores to help you focus on the most important responses:

### High Priority (50+)
- Meeting requests
- Interested leads
- Positive sentiment with high confidence

### Medium Priority (20-49)
- Questions
- Needs more information
- Neutral responses

### Low Priority (0-19)
- Not interested
- Out of office
- Bounces

### Query High Priority Responses

```sql
SELECT 
  from_email,
  subject,
  ai_category,
  ai_summary,
  ai_suggested_action
FROM cold_outreach_email_responses
WHERE 
  (ai_category = 'interested' OR ai_category = 'meeting_request')
  AND ai_confidence_score > 0.7
ORDER BY received_at DESC;
```

---

## Testing

### Test AI Analysis Manually

You can test the AI analysis without sending real emails:

```typescript
import { analyzeEmailResponse } from '@/lib/ai-response-analyzer';

const analysis = await analyzeEmailResponse(
  "Quick question about TechCrunch",
  "Hi Sarah, I noticed your article on AI startups...",
  "Re: Quick question about TechCrunch",
  "Thanks for reaching out! I'd love to learn more."
);

console.log(analysis);
```

### Test with Webhook

Send a test webhook with a sample response:

```bash
curl -X POST https://sway-pr-leads-g4bfk.ondigitalocean.app/api/email-automation/webhook-response \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "from=test@example.com" \
  -d "to=replies@yourdomain.com" \
  -d "subject=Re: Your email" \
  -d "text=Thanks for reaching out! I'd love to learn more about your company." \
  -d "headers=In-Reply-To: <message-id>"
```

Check the response for AI analysis results.

---

## Cost Considerations

### OpenAI API Costs

Using GPT-4o-mini (recommended):
- **Cost:** ~$0.0001 per response analyzed
- **Example:** 1,000 responses = $0.10
- **Very affordable** for most use cases

### Rate Limits

- OpenAI: 500 requests/minute (free tier)
- System processes responses in batches of 5
- Built-in rate limiting and error handling

---

## Monitoring

### Check AI Analysis Performance

```sql
-- Average confidence score
SELECT AVG(ai_confidence_score) as avg_confidence
FROM cold_outreach_email_responses
WHERE ai_confidence_score IS NOT NULL;

-- Analysis success rate
SELECT 
  COUNT(*) as total_responses,
  COUNT(ai_sentiment) as analyzed,
  COUNT(ai_analysis_error) as errors,
  (COUNT(ai_sentiment)::float / COUNT(*)::float * 100) as success_rate
FROM cold_outreach_email_responses;

-- Most common categories
SELECT 
  ai_category,
  COUNT(*) as count,
  AVG(ai_confidence_score) as avg_confidence
FROM cold_outreach_email_responses
WHERE ai_category IS NOT NULL
GROUP BY ai_category
ORDER BY count DESC;
```

---

## Troubleshooting

### AI Analysis Not Working

**Check:**
1. Is `OPENAI_API_KEY` set in environment variables?
2. Check DigitalOcean logs for errors
3. Verify OpenAI API key is valid
4. Check OpenAI usage limits

```sql
-- Check for analysis errors
SELECT 
  from_email,
  ai_analysis_error,
  received_at
FROM cold_outreach_email_responses
WHERE ai_analysis_error IS NOT NULL
ORDER BY received_at DESC;
```

### Low Confidence Scores

If AI confidence is consistently low:
- Responses might be very short or unclear
- Consider manual review for low-confidence responses
- Adjust confidence threshold in your queries

```sql
-- Find low-confidence responses
SELECT 
  from_email,
  subject,
  body_preview,
  ai_confidence_score,
  ai_summary
FROM cold_outreach_email_responses
WHERE ai_confidence_score < 0.5
ORDER BY received_at DESC;
```

---

## Best Practices

### 1. Review High-Priority Responses Daily

```sql
SELECT * FROM cold_outreach_response_dashboard
WHERE 
  ai_category IN ('interested', 'meeting_request')
  OR ai_suggested_action = 'reply_manually'
ORDER BY received_at DESC;
```

### 2. Act on Suggested Actions

- `reply_manually` → Respond within 24 hours
- `schedule_meeting` → Send calendar link
- `send_info` → Send requested materials
- `mark_interested` → Add to CRM/follow-up list

### 3. Monitor Sentiment Trends

Track sentiment over time to improve your email templates:

```sql
SELECT 
  DATE(received_at) as date,
  ai_sentiment,
  COUNT(*) as count
FROM cold_outreach_email_responses
WHERE ai_sentiment IS NOT NULL
GROUP BY DATE(received_at), ai_sentiment
ORDER BY date DESC;
```

### 4. Use Confidence Scores

Only auto-act on high-confidence analyses (>0.7):

```sql
SELECT * FROM cold_outreach_email_responses
WHERE 
  ai_confidence_score > 0.7
  AND ai_suggested_action IN ('mark_interested', 'mark_not_interested');
```

---

## Summary

### What You Get

- ✅ Automatic sentiment analysis
- ✅ Response categorization
- ✅ Action suggestions
- ✅ Priority scoring
- ✅ Confidence ratings
- ✅ AI-generated summaries

### What You Need

- ⏳ OpenAI API key
- ⏳ Run database schema update
- ⏳ Deploy updated code

### Time to Setup

- **Database:** 2 minutes
- **API Key:** 3 minutes
- **Deploy:** Automatic
- **Total:** 5 minutes

**Your responses will be automatically analyzed with AI! 🤖**
