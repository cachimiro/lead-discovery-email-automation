/**
 * VERIFICATION SCRIPT
 * 
 * Checks that email automation system is properly set up
 */

import { supabaseAdmin } from '../lib/supabase';

async function verifySetup() {
  console.log('🔍 Verifying Email Automation Setup...\n');
  
  const supabase = supabaseAdmin();
  let allPassed = true;
  
  // Check 1: Database tables exist
  console.log('1️⃣ Checking database tables...');
  const tables = [
    'cold_outreach_email_queue',
    'cold_outreach_sending_schedule',
    'cold_outreach_campaign_automation',
    'cold_outreach_email_responses',
    'cold_outreach_email_log',
    'cold_outreach_dead_letter_queue',
    'cold_outreach_rate_limit_tracking'
  ];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`   ❌ Table '${table}' not found or not accessible`);
      console.log(`      Error: ${error.message}`);
      allPassed = false;
    } else {
      console.log(`   ✅ Table '${table}' exists`);
    }
  }
  
  // Check 2: Database functions exist
  console.log('\n2️⃣ Checking database functions...');
  
  try {
    // Test reserve_email_slot function
    const { error: slotError } = await supabase.rpc('reserve_email_slot', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_send_date: new Date().toISOString().split('T')[0]
    });
    
    if (slotError && !slotError.message.includes('does not exist')) {
      console.log('   ✅ Function reserve_email_slot() exists');
    } else if (slotError) {
      console.log('   ❌ Function reserve_email_slot() not found');
      allPassed = false;
    }
  } catch (error: any) {
    console.log('   ❌ Error testing reserve_email_slot():', error.message);
    allPassed = false;
  }
  
  try {
    // Test cancel_follow_ups_for_recipient function
    const { error: cancelError } = await supabase.rpc('cancel_follow_ups_for_recipient', {
      p_campaign_id: '00000000-0000-0000-0000-000000000000',
      p_recipient_email: 'test@example.com'
    });
    
    if (cancelError && !cancelError.message.includes('does not exist')) {
      console.log('   ✅ Function cancel_follow_ups_for_recipient() exists');
    } else if (cancelError) {
      console.log('   ❌ Function cancel_follow_ups_for_recipient() not found');
      allPassed = false;
    }
  } catch (error: any) {
    console.log('   ❌ Error testing cancel_follow_ups_for_recipient():', error.message);
    allPassed = false;
  }
  
  // Check 3: Environment variables
  console.log('\n3️⃣ Checking environment variables...');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SENDGRID_API_KEY',
    'SENDGRID_VERIFIED_SENDER',
    'CRON_SECRET'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      if (envVar === 'SENDGRID_API_KEY' && process.env[envVar] === 'YOUR_SENDGRID_API_KEY_HERE') {
        console.log(`   ⚠️  ${envVar} is set but needs to be updated with real API key`);
      } else {
        console.log(`   ✅ ${envVar} is set`);
      }
    } else {
      console.log(`   ❌ ${envVar} is missing`);
      allPassed = false;
    }
  }
  
  // Check 4: Dependencies installed
  console.log('\n4️⃣ Checking dependencies...');
  
  try {
    require('@sendgrid/mail');
    console.log('   ✅ @sendgrid/mail is installed');
  } catch (error) {
    console.log('   ❌ @sendgrid/mail is not installed');
    console.log('      Run: npm install @sendgrid/mail');
    allPassed = false;
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ ALL CHECKS PASSED - System is ready!');
    console.log('\nNext steps:');
    console.log('1. Get SendGrid API key from https://sendgrid.com/');
    console.log('2. Update SENDGRID_API_KEY in .env.local');
    console.log('3. Test the system with: npm run dev');
    console.log('4. Visit: http://localhost:3000/api/email-automation/health');
  } else {
    console.log('❌ SOME CHECKS FAILED - Please fix the issues above');
    console.log('\nCommon fixes:');
    console.log('1. Run database migrations in Supabase SQL Editor');
    console.log('2. Check .env.local has all required variables');
    console.log('3. Run: npm install @sendgrid/mail');
  }
  console.log('='.repeat(60) + '\n');
  
  process.exit(allPassed ? 0 : 1);
}

verifySetup().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
