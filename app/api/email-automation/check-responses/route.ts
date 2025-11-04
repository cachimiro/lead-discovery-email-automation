/**
 * CHECK EMAIL RESPONSES (OAuth - Gmail/Microsoft)
 * 
 * Actively checks for replies to sent emails using Gmail API or Microsoft Graph API
 * Should be called by cron job every 15-30 minutes
 * 
 * This is different from the webhook endpoint which is for SendGrid.
 * OAuth emails require active polling since we can't receive webhooks.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { analyzeEmailResponse, requiresImmediateAttention, getResponsePriority } from '@/lib/ai-response-analyzer';

interface EmailThread {
  id: string;
  from: string;
  subject: string;
  body: string;
  receivedAt: string;
}

/**
 * Get user's OAuth tokens
 */
async function getUserOAuthTokens(userId: string): Promise<{
  provider: 'google' | 'microsoft';
  accessToken: string;
  refreshToken?: string;
  email: string;
} | null> {
  const supabase = supabaseAdmin();
  
  const { data: profile } = await supabase
    .from('cold_outreach_user_profiles')
    .select('email')
    .eq('id', userId)
    .single();
  
  if (!profile?.email) {
    return null;
  }
  
  const { data: tokens } = await supabase
    .from('cold_outreach_oauth_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (!tokens) {
    return null;
  }
  
  return {
    provider: tokens.provider,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    email: profile.email
  };
}

/**
 * Check Gmail for replies
 */
async function checkGmailReplies(
  accessToken: string,
  userEmail: string,
  since: Date
): Promise<EmailThread[]> {
  try {
    const sinceTimestamp = Math.floor(since.getTime() / 1000);
    
    // Search for emails received after the timestamp
    const query = `to:${userEmail} after:${sinceTimestamp}`;
    const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });
    
    if (!searchResponse.ok) {
      throw new Error(`Gmail API error: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.messages || searchData.messages.length === 0) {
      return [];
    }
    
    // Fetch full message details
    const threads: EmailThread[] = [];
    
    for (const message of searchData.messages.slice(0, 50)) { // Limit to 50 most recent
      const messageUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`;
      const messageResponse = await fetch(messageUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });
      
      if (!messageResponse.ok) continue;
      
      const messageData = await messageResponse.json();
      
      // Extract headers
      const headers = messageData.payload.headers;
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
      const inReplyTo = headers.find((h: any) => h.name === 'In-Reply-To')?.value || '';
      
      // Only process if it's a reply (has In-Reply-To header)
      if (!inReplyTo) continue;
      
      // Extract body
      let body = '';
      if (messageData.payload.body.data) {
        body = Buffer.from(messageData.payload.body.data, 'base64').toString('utf-8');
      } else if (messageData.payload.parts) {
        const textPart = messageData.payload.parts.find((p: any) => p.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      }
      
      // Extract email from "Name <email@domain.com>" format
      const emailMatch = from.match(/<([^>]+)>/);
      const fromEmail = emailMatch ? emailMatch[1] : from;
      
      threads.push({
        id: messageData.threadId || message.id,
        from: fromEmail,
        subject,
        body,
        receivedAt: new Date(parseInt(messageData.internalDate)).toISOString()
      });
    }
    
    return threads;
    
  } catch (error) {
    console.error('Error checking Gmail replies:', error);
    return [];
  }
}

/**
 * Check Microsoft for replies
 */
async function checkMicrosoftReplies(
  accessToken: string,
  userEmail: string,
  since: Date
): Promise<EmailThread[]> {
  try {
    const sinceISO = since.toISOString();
    
    // Get messages received after timestamp
    const url = `https://graph.microsoft.com/v1.0/me/messages?$filter=receivedDateTime ge ${sinceISO}&$top=50&$orderby=receivedDateTime desc`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });
    
    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.value || data.value.length === 0) {
      return [];
    }
    
    const threads: EmailThread[] = [];
    
    for (const message of data.value) {
      // Only process if it's a reply (has conversationId and is not the first message)
      if (!message.conversationId) continue;
      
      const fromEmail = message.from?.emailAddress?.address || '';
      
      threads.push({
        id: message.conversationId,
        from: fromEmail,
        subject: message.subject || '',
        body: message.body?.content || message.bodyPreview || '',
        receivedAt: message.receivedDateTime
      });
    }
    
    return threads;
    
  } catch (error) {
    console.error('Error checking Microsoft replies:', error);
    return [];
  }
}

/**
 * Process a reply and cancel follow-ups
 */
async function processReply(
  userId: string,
  thread: EmailThread
): Promise<boolean> {
  const supabase = supabaseAdmin();
  
  try {
    // Find the original sent email
    const { data: sentEmail } = await supabase
      .from('cold_outreach_email_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('recipient_email', thread.from)
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!sentEmail) {
      console.log(`No sent email found for ${thread.from}`);
      return false;
    }
    
    // Check if response already recorded
    const { data: existingResponse } = await supabase
      .from('cold_outreach_email_responses')
      .select('id')
      .eq('from_email', thread.from)
      .eq('campaign_id', sentEmail.campaign_id)
      .single();
    
    if (existingResponse) {
      console.log(`Response already recorded for ${thread.from}`);
      return false;
    }
    
    // Analyze response with AI
    let aiAnalysis = null;
    if (process.env.OPENAI_API_KEY) {
      try {
        aiAnalysis = await analyzeEmailResponse(
          sentEmail.subject,
          sentEmail.body,
          thread.subject,
          thread.body
        );
        console.log(`AI Analysis for ${thread.from}: ${aiAnalysis.category} (${aiAnalysis.sentiment})`);
      } catch (error) {
        console.error('AI analysis failed:', error);
      }
    }
    
    // Record the response
    const { data: response, error: responseError } = await supabase
      .from('cold_outreach_email_responses')
      .insert({
        user_id: userId,
        email_queue_id: sentEmail.id,
        campaign_id: sentEmail.campaign_id,
        from_email: thread.from,
        subject: thread.subject,
        body_preview: thread.body.substring(0, 500),
        received_at: thread.receivedAt,
        thread_id: thread.id,
        message_id: thread.id,
        processed: false,
        cancelled_follow_ups: false,
        ai_sentiment: aiAnalysis?.sentiment || null,
        ai_category: aiAnalysis?.category || null,
        ai_confidence_score: aiAnalysis?.confidenceScore || null,
        ai_summary: aiAnalysis?.summary || null,
        ai_suggested_action: aiAnalysis?.suggestedAction || null,
        ai_analysis_completed_at: aiAnalysis ? new Date().toISOString() : null
      })
      .select()
      .single();
    
    if (responseError) {
      console.error('Error recording response:', responseError);
      return false;
    }
    
    // Cancel follow-ups
    const { data: cancelData } = await supabase.rpc('cancel_follow_ups_for_recipient', {
      p_campaign_id: sentEmail.campaign_id,
      p_recipient_email: thread.from
    });
    
    const cancelledCount = cancelData || 0;
    
    // Update response record
    await supabase
      .from('cold_outreach_email_responses')
      .update({
        cancelled_follow_ups: true,
        follow_ups_cancelled_count: cancelledCount,
        processed: true
      })
      .eq('id', response.id);
    
    // Update original email status
    await supabase
      .from('cold_outreach_email_queue')
      .update({
        status: 'response_received',
        response_detected_at: new Date().toISOString(),
        response_thread_id: thread.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', sentEmail.id);
    
    // Log the response
    await supabase.from('cold_outreach_email_log').insert({
      user_id: userId,
      email_queue_id: sentEmail.id,
      campaign_id: sentEmail.campaign_id,
      event_type: 'response_received',
      message: `Response received from ${thread.from}${aiAnalysis ? ` - AI: ${aiAnalysis.category} (${aiAnalysis.sentiment})` : ''}`,
      metadata: {
        from_email: thread.from,
        subject: thread.subject,
        thread_id: thread.id,
        follow_ups_cancelled: cancelledCount
      },
      ai_metadata: aiAnalysis ? {
        sentiment: aiAnalysis.sentiment,
        category: aiAnalysis.category,
        confidence: aiAnalysis.confidenceScore,
        summary: aiAnalysis.summary,
        suggested_action: aiAnalysis.suggestedAction,
        reasoning: aiAnalysis.reasoning,
        requires_attention: requiresImmediateAttention(aiAnalysis),
        priority_score: getResponsePriority(aiAnalysis)
      } : null
    });
    
    console.log(`✅ Processed reply from ${thread.from}: ${cancelledCount} follow-ups cancelled`);
    
    return true;
    
  } catch (error) {
    console.error('Error processing reply:', error);
    return false;
  }
}

/**
 * Main cron job handler
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const supabase = supabaseAdmin();
    const now = new Date();
    
    console.log(`\n🔍 Checking for email responses at ${now.toISOString()}`);
    
    // Get all users with active campaigns
    const { data: users } = await supabase
      .from('cold_outreach_user_profiles')
      .select('id, email');
    
    if (!users || users.length === 0) {
      console.log('No users found');
      return NextResponse.json({
        success: true,
        message: 'No users to check',
        processed: 0
      });
    }
    
    let totalProcessed = 0;
    
    for (const user of users) {
      try {
        // Get OAuth tokens
        const tokens = await getUserOAuthTokens(user.id);
        
        if (!tokens) {
          console.log(`No OAuth tokens for user ${user.email}`);
          continue;
        }
        
        // Check for replies in the last 24 hours
        const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        let threads: EmailThread[] = [];
        
        if (tokens.provider === 'google') {
          threads = await checkGmailReplies(tokens.accessToken, tokens.email, since);
        } else {
          threads = await checkMicrosoftReplies(tokens.accessToken, tokens.email, since);
        }
        
        console.log(`Found ${threads.length} potential replies for ${user.email}`);
        
        // Process each reply
        for (const thread of threads) {
          const processed = await processReply(user.id, thread);
          if (processed) {
            totalProcessed++;
          }
        }
        
      } catch (error) {
        console.error(`Error checking responses for user ${user.email}:`, error);
        continue;
      }
    }
    
    console.log(`✅ Response check complete: ${totalProcessed} new responses processed\n`);
    
    return NextResponse.json({
      success: true,
      message: 'Response check complete',
      processed: totalProcessed
    });
    
  } catch (error: any) {
    console.error('Error in response check:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'OAuth email response checker',
    timestamp: new Date().toISOString()
  });
}
