-- Email Automation System for Cold Outreach
-- Handles scheduling, rate limiting, follow-ups, and response tracking
-- Run this in Supabase SQL Editor

-- 1. Email Queue - Tracks all emails to be sent with scheduling
CREATE TABLE IF NOT EXISTS cold_outreach_email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_id uuid NOT NULL REFERENCES cold_outreach_email_campaigns(id) ON DELETE CASCADE,
  
  -- Email details
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  
  -- Scheduling
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  
  -- Status tracking
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled', 'response_received')),
  error_message text,
  
  -- Follow-up tracking
  is_follow_up boolean DEFAULT false,
  follow_up_number int DEFAULT 1 CHECK (follow_up_number IN (1, 2, 3)),
  parent_email_id uuid REFERENCES cold_outreach_email_queue(id),
  
  -- Response tracking
  response_detected_at timestamptz,
  response_thread_id text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Indexes
  CONSTRAINT unique_campaign_followup UNIQUE (campaign_id, follow_up_number)
);

CREATE INDEX idx_email_queue_user_id ON cold_outreach_email_queue(user_id);
CREATE INDEX idx_email_queue_status ON cold_outreach_email_queue(status);
CREATE INDEX idx_email_queue_scheduled_for ON cold_outreach_email_queue(scheduled_for);
CREATE INDEX idx_email_queue_campaign_id ON cold_outreach_email_queue(campaign_id);
CREATE INDEX idx_email_queue_recipient ON cold_outreach_email_queue(recipient_email);

-- 2. Email Sending Schedule - Tracks daily sending limits
CREATE TABLE IF NOT EXISTS cold_outreach_sending_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  
  -- Date tracking
  send_date date NOT NULL,
  
  -- Rate limiting (28 emails per day)
  emails_sent_today int DEFAULT 0,
  max_emails_per_day int DEFAULT 28,
  
  -- Time window (9am - 5pm London time)
  sending_start_hour int DEFAULT 9,
  sending_end_hour int DEFAULT 17,
  timezone text DEFAULT 'Europe/London',
  
  -- Status
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_user_date UNIQUE (user_id, send_date)
);

CREATE INDEX idx_sending_schedule_user_date ON cold_outreach_sending_schedule(user_id, send_date);

-- 3. Campaign Automation Settings
CREATE TABLE IF NOT EXISTS cold_outreach_campaign_automation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  
  -- Automation settings
  is_active boolean DEFAULT false,
  
  -- Rate limiting
  max_emails_per_day int DEFAULT 28,
  sending_start_hour int DEFAULT 9,
  sending_end_hour int DEFAULT 17,
  timezone text DEFAULT 'Europe/London',
  
  -- Follow-up settings
  follow_up_delay_days int DEFAULT 3,
  skip_weekends boolean DEFAULT true,
  
  -- Response tracking
  check_responses boolean DEFAULT true,
  gmail_connected boolean DEFAULT false,
  outlook_connected boolean DEFAULT false,
  
  -- OAuth tokens (encrypted)
  gmail_refresh_token text,
  outlook_refresh_token text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_user_automation UNIQUE (user_id)
);

-- 4. Email Response Tracking
CREATE TABLE IF NOT EXISTS cold_outreach_email_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email_queue_id uuid REFERENCES cold_outreach_email_queue(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES cold_outreach_email_campaigns(id) ON DELETE CASCADE,
  
  -- Response details
  from_email text NOT NULL,
  subject text,
  body_preview text,
  received_at timestamptz NOT NULL,
  
  -- Thread tracking
  thread_id text,
  message_id text,
  in_reply_to text,
  
  -- Processing
  processed boolean DEFAULT false,
  cancelled_follow_ups boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_email_responses_user_id ON cold_outreach_email_responses(user_id);
CREATE INDEX idx_email_responses_campaign_id ON cold_outreach_email_responses(campaign_id);
CREATE INDEX idx_email_responses_from_email ON cold_outreach_email_responses(from_email);
CREATE INDEX idx_email_responses_thread_id ON cold_outreach_email_responses(thread_id);

-- 5. Email Sending Log - Audit trail
CREATE TABLE IF NOT EXISTS cold_outreach_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email_queue_id uuid REFERENCES cold_outreach_email_queue(id),
  
  -- Event details
  event_type text NOT NULL CHECK (event_type IN ('scheduled', 'sent', 'failed', 'cancelled', 'response_received', 'follow_up_cancelled')),
  message text,
  metadata jsonb,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_email_log_user_id ON cold_outreach_email_log(user_id);
CREATE INDEX idx_email_log_queue_id ON cold_outreach_email_log(email_queue_id);
CREATE INDEX idx_email_log_created_at ON cold_outreach_email_log(created_at DESC);

-- Comments
COMMENT ON TABLE cold_outreach_email_queue IS 'Queue of all emails to be sent with scheduling and status tracking';
COMMENT ON TABLE cold_outreach_sending_schedule IS 'Daily sending limits and schedule tracking (28 emails/day, 9am-5pm)';
COMMENT ON TABLE cold_outreach_campaign_automation IS 'User automation settings for email campaigns';
COMMENT ON TABLE cold_outreach_email_responses IS 'Tracks responses to sent emails to prevent follow-ups';
COMMENT ON TABLE cold_outreach_email_log IS 'Audit log of all email events';

-- Success message
SELECT 'Email automation tables created successfully!' as status,
       'Remember to set up OAuth for Gmail/Outlook response tracking' as note;
