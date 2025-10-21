-- ============================================================================
-- VERIFICATION SCRIPT FOR EMAIL AUTOMATION SYSTEM
-- ============================================================================
-- Run this in Supabase SQL Editor to verify setup is complete
-- ============================================================================

DO $$
DECLARE
  v_table_count int;
  v_function_count int;
  v_all_good boolean := true;
BEGIN
  RAISE NOTICE '🔍 Verifying Email Automation Setup...';
  RAISE NOTICE '';
  
  -- Check 1: Tables exist
  RAISE NOTICE '1️⃣ Checking database tables...';
  
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'cold_outreach_email_queue',
    'cold_outreach_sending_schedule',
    'cold_outreach_campaign_automation',
    'cold_outreach_email_responses',
    'cold_outreach_email_log',
    'cold_outreach_dead_letter_queue',
    'cold_outreach_rate_limit_tracking'
  );
  
  IF v_table_count = 7 THEN
    RAISE NOTICE '   ✅ All 7 tables exist';
  ELSE
    RAISE NOTICE '   ❌ Only % of 7 tables found', v_table_count;
    v_all_good := false;
  END IF;
  
  -- List tables
  FOR v_table_count IN 
    SELECT table_name::text
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name LIKE 'cold_outreach_%'
    ORDER BY table_name
  LOOP
    RAISE NOTICE '      • %', v_table_count;
  END LOOP;
  
  -- Check 2: Functions exist
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣ Checking database functions...';
  
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN ('reserve_email_slot', 'cancel_follow_ups_for_recipient');
  
  IF v_function_count = 2 THEN
    RAISE NOTICE '   ✅ Both functions exist';
    RAISE NOTICE '      • reserve_email_slot()';
    RAISE NOTICE '      • cancel_follow_ups_for_recipient()';
  ELSE
    RAISE NOTICE '   ❌ Only % of 2 functions found', v_function_count;
    v_all_good := false;
  END IF;
  
  -- Check 3: Constraints
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣ Checking safety constraints...';
  
  -- Check unique constraints
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_recipient_campaign_followup'
  ) THEN
    RAISE NOTICE '   ✅ Duplicate prevention constraint exists';
  ELSE
    RAISE NOTICE '   ❌ Duplicate prevention constraint missing';
    v_all_good := false;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_max_emails'
  ) THEN
    RAISE NOTICE '   ✅ Rate limit constraint exists';
  ELSE
    RAISE NOTICE '   ❌ Rate limit constraint missing';
    v_all_good := false;
  END IF;
  
  -- Check 4: Row Level Security
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣ Checking Row Level Security...';
  
  SELECT COUNT(*) INTO v_table_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename LIKE 'cold_outreach_%'
  AND rowsecurity = true;
  
  IF v_table_count = 7 THEN
    RAISE NOTICE '   ✅ RLS enabled on all 7 tables';
  ELSE
    RAISE NOTICE '   ⚠️  RLS enabled on only % of 7 tables', v_table_count;
  END IF;
  
  -- Check 5: Indexes
  RAISE NOTICE '';
  RAISE NOTICE '5️⃣ Checking indexes...';
  
  SELECT COUNT(*) INTO v_table_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND tablename LIKE 'cold_outreach_%';
  
  RAISE NOTICE '   ✅ % indexes created for performance', v_table_count;
  
  -- Summary
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  IF v_all_good THEN
    RAISE NOTICE '✅ ALL CHECKS PASSED - Database is ready!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Get SendGrid API key from https://sendgrid.com/';
    RAISE NOTICE '2. Update SENDGRID_API_KEY in .env.local';
    RAISE NOTICE '3. Run: npm run dev';
    RAISE NOTICE '4. Visit: /api/email-automation/health';
  ELSE
    RAISE NOTICE '❌ SOME CHECKS FAILED';
    RAISE NOTICE '';
    RAISE NOTICE 'Please re-run: db/BULLETPROOF_EMAIL_AUTOMATION_SCHEMA.sql';
  END IF;
  RAISE NOTICE '============================================================';
  
END $$;

-- Show table row counts
SELECT 
  'cold_outreach_email_queue' as table_name,
  COUNT(*) as row_count
FROM cold_outreach_email_queue
UNION ALL
SELECT 
  'cold_outreach_sending_schedule',
  COUNT(*)
FROM cold_outreach_sending_schedule
UNION ALL
SELECT 
  'cold_outreach_campaign_automation',
  COUNT(*)
FROM cold_outreach_campaign_automation
UNION ALL
SELECT 
  'cold_outreach_email_responses',
  COUNT(*)
FROM cold_outreach_email_responses
UNION ALL
SELECT 
  'cold_outreach_email_log',
  COUNT(*)
FROM cold_outreach_email_log
UNION ALL
SELECT 
  'cold_outreach_dead_letter_queue',
  COUNT(*)
FROM cold_outreach_dead_letter_queue
UNION ALL
SELECT 
  'cold_outreach_rate_limit_tracking',
  COUNT(*)
FROM cold_outreach_rate_limit_tracking;
