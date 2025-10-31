/**
 * Test OAuth Email Sending
 * 
 * This script tests the OAuth email sending functionality
 */

import { supabaseAdmin } from '../lib/supabase';
import { sendEmailViaOAuth } from '../lib/email-automation/oauth-email-sender';

async function testOAuthEmail() {
  console.log('🧪 Testing OAuth Email Sending\n');
  
  const supabase = supabaseAdmin();
  
  // Check if OAuth tokens table exists
  console.log('1. Checking OAuth tokens table...');
  const { data: tables, error: tableError } = await supabase
    .from('cold_outreach_oauth_tokens')
    .select('count')
    .limit(1);
  
  if (tableError) {
    console.log('❌ OAuth tokens table not found. Please run the migration:');
    console.log('   db/migrations/add_oauth_tokens_table.sql\n');
    return;
  }
  console.log('✅ OAuth tokens table exists\n');
  
  // Check for users with OAuth tokens
  console.log('2. Checking for users with OAuth tokens...');
  const { data: tokens, error: tokensError } = await supabase
    .from('cold_outreach_oauth_tokens')
    .select('user_id, provider, created_at');
  
  if (tokensError) {
    console.log('❌ Error fetching tokens:', tokensError.message);
    return;
  }
  
  if (!tokens || tokens.length === 0) {
    console.log('⚠️  No OAuth tokens found.');
    console.log('   Users need to sign out and sign back in to grant email permissions.\n');
    return;
  }
  
  console.log(`✅ Found ${tokens.length} OAuth token(s):`);
  tokens.forEach(token => {
    console.log(`   - User: ${token.user_id}, Provider: ${token.provider}, Created: ${token.created_at}`);
  });
  console.log('');
  
  // Check for pending emails
  console.log('3. Checking for pending emails...');
  const { data: pendingEmails, error: emailError } = await supabase
    .from('cold_outreach_email_queue')
    .select('id, user_id, recipient_email, subject, status')
    .eq('status', 'pending')
    .limit(5);
  
  if (emailError) {
    console.log('❌ Error fetching emails:', emailError.message);
    return;
  }
  
  if (!pendingEmails || pendingEmails.length === 0) {
    console.log('ℹ️  No pending emails in queue.\n');
  } else {
    console.log(`✅ Found ${pendingEmails.length} pending email(s):`);
    pendingEmails.forEach(email => {
      console.log(`   - To: ${email.recipient_email}, Subject: ${email.subject}`);
    });
    console.log('');
  }
  
  console.log('✅ OAuth email system is ready!');
  console.log('\nNext steps:');
  console.log('1. Ensure users have signed in with Google or Microsoft');
  console.log('2. Users must approve email sending permissions');
  console.log('3. Create email campaigns to start sending');
  console.log('\nFor detailed setup instructions, see: OAUTH_EMAIL_SETUP.md');
}

testOAuthEmail().catch(console.error);
