-- ============================================================================
-- AI RESPONSE ANALYSIS - Database Schema Extension
-- ============================================================================
-- Adds AI-powered response analysis to email automation system
-- ============================================================================

-- Add AI analysis columns to email_responses table
ALTER TABLE cold_outreach_email_responses
ADD COLUMN IF NOT EXISTS ai_sentiment text CHECK (ai_sentiment IN ('positive', 'negative', 'neutral', 'question', 'out_of_office')),
ADD COLUMN IF NOT EXISTS ai_category text CHECK (ai_category IN ('interested', 'not_interested', 'needs_info', 'meeting_request', 'unsubscribe', 'bounce', 'other')),
ADD COLUMN IF NOT EXISTS ai_confidence_score decimal(3,2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
ADD COLUMN IF NOT EXISTS ai_summary text,
ADD COLUMN IF NOT EXISTS ai_suggested_action text CHECK (ai_suggested_action IN ('reply_manually', 'schedule_meeting', 'send_info', 'mark_interested', 'mark_not_interested', 'no_action')),
ADD COLUMN IF NOT EXISTS ai_analysis_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS ai_analysis_error text;

-- Create index for AI-analyzed responses
CREATE INDEX IF NOT EXISTS idx_email_responses_ai_category 
ON cold_outreach_email_responses(ai_category) 
WHERE ai_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_responses_ai_sentiment 
ON cold_outreach_email_responses(ai_sentiment) 
WHERE ai_sentiment IS NOT NULL;

-- Add AI analysis metadata to email_log
ALTER TABLE cold_outreach_email_log
ADD COLUMN IF NOT EXISTS ai_metadata jsonb;

COMMENT ON COLUMN cold_outreach_email_responses.ai_sentiment IS 'AI-detected sentiment: positive, negative, neutral, question, out_of_office';
COMMENT ON COLUMN cold_outreach_email_responses.ai_category IS 'AI-categorized response type for workflow decisions';
COMMENT ON COLUMN cold_outreach_email_responses.ai_confidence_score IS 'AI confidence in analysis (0.0 to 1.0)';
COMMENT ON COLUMN cold_outreach_email_responses.ai_summary IS 'AI-generated summary of response content';
COMMENT ON COLUMN cold_outreach_email_responses.ai_suggested_action IS 'AI-recommended next action';

-- ============================================================================
-- View: Response Dashboard with AI Insights
-- ============================================================================

CREATE OR REPLACE VIEW cold_outreach_response_dashboard AS
SELECT 
  r.id,
  r.user_id,
  r.campaign_id,
  c.name as campaign_name,
  r.from_email,
  r.subject,
  r.body_preview,
  r.received_at,
  r.ai_sentiment,
  r.ai_category,
  r.ai_confidence_score,
  r.ai_summary,
  r.ai_suggested_action,
  r.cancelled_follow_ups,
  r.follow_ups_cancelled_count,
  eq.recipient_email as original_recipient,
  eq.subject as original_subject
FROM cold_outreach_email_responses r
LEFT JOIN cold_outreach_email_campaigns c ON r.campaign_id = c.id
LEFT JOIN cold_outreach_email_queue eq ON r.email_queue_id = eq.id
ORDER BY r.received_at DESC;

COMMENT ON VIEW cold_outreach_response_dashboard IS 'Dashboard view of all responses with AI analysis';

-- ============================================================================
-- Function: Get Response Statistics with AI Breakdown
-- ============================================================================

CREATE OR REPLACE FUNCTION get_response_stats_with_ai(
  p_user_id uuid,
  p_campaign_id uuid DEFAULT NULL
) RETURNS TABLE (
  total_responses bigint,
  positive_responses bigint,
  negative_responses bigint,
  questions bigint,
  interested bigint,
  not_interested bigint,
  needs_manual_reply bigint,
  avg_confidence_score decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_responses,
    COUNT(*) FILTER (WHERE ai_sentiment = 'positive')::bigint as positive_responses,
    COUNT(*) FILTER (WHERE ai_sentiment = 'negative')::bigint as negative_responses,
    COUNT(*) FILTER (WHERE ai_sentiment = 'question')::bigint as questions,
    COUNT(*) FILTER (WHERE ai_category = 'interested')::bigint as interested,
    COUNT(*) FILTER (WHERE ai_category = 'not_interested')::bigint as not_interested,
    COUNT(*) FILTER (WHERE ai_suggested_action = 'reply_manually')::bigint as needs_manual_reply,
    AVG(ai_confidence_score) as avg_confidence_score
  FROM cold_outreach_email_responses
  WHERE user_id = p_user_id
    AND (p_campaign_id IS NULL OR campaign_id = p_campaign_id);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_response_stats_with_ai IS 'Get response statistics with AI analysis breakdown';

-- ============================================================================
-- Verification Query
-- ============================================================================

-- Run this to verify the schema was applied correctly
DO $$
BEGIN
  RAISE NOTICE 'AI Response Analysis Schema Applied Successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'New columns added to cold_outreach_email_responses:';
  RAISE NOTICE '  • ai_sentiment (positive/negative/neutral/question/out_of_office)';
  RAISE NOTICE '  • ai_category (interested/not_interested/needs_info/etc)';
  RAISE NOTICE '  • ai_confidence_score (0.0 to 1.0)';
  RAISE NOTICE '  • ai_summary (AI-generated summary)';
  RAISE NOTICE '  • ai_suggested_action (reply_manually/schedule_meeting/etc)';
  RAISE NOTICE '';
  RAISE NOTICE 'New view created: cold_outreach_response_dashboard';
  RAISE NOTICE 'New function created: get_response_stats_with_ai()';
END $$;
