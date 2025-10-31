/**
 * SENDGRID INBOUND WEBHOOK
 * 
 * Receives email responses via SendGrid Inbound Parse
 * and automatically cancels follow-ups.
 * 
 * BULLETPROOF FEATURES:
 * - Webhook signature verification
 * - Duplicate response prevention
 * - Thread matching with fallback logic
 * - Atomic follow-up cancellation
 * - Complete audit logging
 */

import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { analyzeEmailResponse, requiresImmediateAttention, getResponsePriority } from '@/lib/ai-response-analyzer';

interface InboundEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  headers: string;
  envelope: string;
  charsets: string;
  SPF: string;
}

/**
 * Verify SendGrid webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  try {
    const webhookSecret = process.env.SENDGRID_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('SENDGRID_WEBHOOK_SECRET not set - skipping verification');
      return true; // Allow in development
    }
    
    const data = timestamp + payload;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(data)
      .digest('base64');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Extract thread ID from email headers
 */
function extractThreadId(headers: string): string | null {
  try {
    const lines = headers.split('\n');
    
    // Look for In-Reply-To header
    const inReplyTo = lines.find(line => 
      line.toLowerCase().startsWith('in-reply-to:')
    );
    
    if (inReplyTo) {
      const match = inReplyTo.match(/<([^>]+)>/);
      if (match) return match[1];
    }
    
    // Look for References header
    const references = lines.find(line => 
      line.toLowerCase().startsWith('references:')
    );
    
    if (references) {
      const matches = references.match(/<([^>]+)>/g);
      if (matches && matches.length > 0) {
        return matches[0].replace(/[<>]/g, '');
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting thread ID:', error);
    return null;
  }
}

/**
 * Find sent email that this is a reply to
 */
async function findOriginalEmail(
  fromEmail: string,
  threadId: string | null,
  subject: string
): Promise<any | null> {
  const supabase = supabaseAdmin();
  
  try {
    // Method 1: Match by SendGrid message ID (most reliable)
    if (threadId) {
      const { data: byThreadId } = await supabase
        .from('cold_outreach_email_queue')
        .select('*')
        .eq('sendgrid_message_id', threadId)
        .eq('status', 'sent')
        .single();
      
      if (byThreadId) {
        console.log('✅ Matched by thread ID');
        return byThreadId;
      }
    }
    
    // Method 2: Match by recipient email + recent sent
    const { data: byRecipient } = await supabase
      .from('cold_outreach_email_queue')
      .select('*')
      .eq('recipient_email', fromEmail)
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();
    
    if (byRecipient) {
      console.log('✅ Matched by recipient email');
      return byRecipient;
    }
    
    // Method 3: Fuzzy match by subject
    const cleanSubject = subject
      .replace(/^(re:|fwd?:)\s*/gi, '')
      .trim()
      .toLowerCase();
    
    const { data: bySubject } = await supabase
      .from('cold_outreach_email_queue')
      .select('*')
      .eq('recipient_email', fromEmail)
      .eq('status', 'sent')
      .ilike('subject', `%${cleanSubject}%`)
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();
    
    if (bySubject) {
      console.log('✅ Matched by subject fuzzy match');
      return bySubject;
    }
    
    console.log('❌ No match found');
    return null;
    
  } catch (error) {
    console.error('Error finding original email:', error);
    return null;
  }
}

/**
 * Cancel follow-ups for recipient
 */
async function cancelFollowUps(
  campaignId: string,
  recipientEmail: string,
  responseId: string
): Promise<number> {
  const supabase = supabaseAdmin();
  
  try {
    // Use the atomic function from database
    const { data, error } = await supabase.rpc('cancel_follow_ups_for_recipient', {
      p_campaign_id: campaignId,
      p_recipient_email: recipientEmail
    });
    
    if (error) {
      console.error('Error cancelling follow-ups:', error);
      return 0;
    }
    
    const cancelledCount = data || 0;
    
    // Update response record
    await supabase
      .from('cold_outreach_email_responses')
      .update({
        cancelled_follow_ups: true,
        follow_ups_cancelled_count: cancelledCount,
        processed: true
      })
      .eq('id', responseId);
    
    return cancelledCount;
    
  } catch (error) {
    console.error('Error in cancelFollowUps:', error);
    return 0;
  }
}

/**
 * Main webhook handler
 */
export async function POST(request: Request) {
  try {
    // Get webhook signature headers
    const signature = request.headers.get('x-twilio-email-event-webhook-signature');
    const timestamp = request.headers.get('x-twilio-email-event-webhook-timestamp');
    
    const body = await request.text();
    
    // Verify signature (in production)
    if (process.env.NODE_ENV === 'production' && signature && timestamp) {
      const isValid = verifyWebhookSignature(body, signature, timestamp);
      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }
    
    // Parse form data (SendGrid sends as multipart/form-data)
    const formData = new URLSearchParams(body);
    const email: InboundEmail = {
      from: formData.get('from') || '',
      to: formData.get('to') || '',
      subject: formData.get('subject') || '',
      text: formData.get('text') || '',
      html: formData.get('html') || '',
      headers: formData.get('headers') || '',
      envelope: formData.get('envelope') || '',
      charsets: formData.get('charsets') || '',
      SPF: formData.get('SPF') || ''
    };
    
    console.log(`\n📨 Received email response from: ${email.from}`);
    console.log(`   Subject: ${email.subject}`);
    
    // Extract sender email
    const fromEmailMatch = email.from.match(/<([^>]+)>/);
    const fromEmail = fromEmailMatch ? fromEmailMatch[1] : email.from;
    
    // Extract thread ID
    const threadId = extractThreadId(email.headers);
    
    // Find original sent email
    const originalEmail = await findOriginalEmail(fromEmail, threadId, email.subject);
    
    if (!originalEmail) {
      console.log('⚠️ Could not match response to sent email');
      return NextResponse.json({
        success: true,
        message: 'Response received but could not match to sent email'
      });
    }
    
    const supabase = supabaseAdmin();
    
    // Check if response already processed (prevent duplicates)
    const { data: existingResponse } = await supabase
      .from('cold_outreach_email_responses')
      .select('id')
      .eq('from_email', fromEmail)
      .eq('campaign_id', originalEmail.campaign_id)
      .single();
    
    if (existingResponse) {
      console.log('⚠️ Response already processed');
      return NextResponse.json({
        success: true,
        message: 'Response already processed'
      });
    }
    
    // Analyze response with AI (if OpenAI key is available)
    let aiAnalysis = null;
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log('🤖 Analyzing response with AI...');
        aiAnalysis = await analyzeEmailResponse(
          originalEmail.subject,
          originalEmail.body,
          email.subject,
          email.text
        );
        console.log(`✅ AI Analysis: ${aiAnalysis.category} (${aiAnalysis.sentiment}) - Confidence: ${(aiAnalysis.confidenceScore * 100).toFixed(0)}%`);
      } catch (error) {
        console.error('AI analysis failed:', error);
        // Continue without AI analysis
      }
    }

    // Record the response with AI analysis
    const { data: response, error: responseError } = await supabase
      .from('cold_outreach_email_responses')
      .insert({
        user_id: originalEmail.user_id,
        email_queue_id: originalEmail.id,
        campaign_id: originalEmail.campaign_id,
        from_email: fromEmail,
        subject: email.subject,
        body_preview: email.text.substring(0, 500),
        received_at: new Date().toISOString(),
        thread_id: threadId,
        message_id: threadId,
        processed: false,
        cancelled_follow_ups: false,
        // AI analysis fields
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
      return NextResponse.json(
        { error: 'Failed to record response' },
        { status: 500 }
      );
    }
    
    // Cancel follow-ups
    const cancelledCount = await cancelFollowUps(
      originalEmail.campaign_id,
      fromEmail,
      response.id
    );
    
    // Update original email status
    await supabase
      .from('cold_outreach_email_queue')
      .update({
        status: 'response_received',
        response_detected_at: new Date().toISOString(),
        response_thread_id: threadId,
        updated_at: new Date().toISOString()
      })
      .eq('id', originalEmail.id);
    
    // Log the response with AI metadata
    await supabase.from('cold_outreach_email_log').insert({
      user_id: originalEmail.user_id,
      email_queue_id: originalEmail.id,
      campaign_id: originalEmail.campaign_id,
      event_type: 'response_received',
      message: `Response received from ${fromEmail}${aiAnalysis ? ` - AI: ${aiAnalysis.category} (${aiAnalysis.sentiment})` : ''}`,
      metadata: {
        from_email: fromEmail,
        subject: email.subject,
        thread_id: threadId,
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
    
    console.log(`✅ Response processed: ${cancelledCount} follow-ups cancelled\n`);
    
    return NextResponse.json({
      success: true,
      message: 'Response processed successfully',
      follow_ups_cancelled: cancelledCount,
      ai_analysis: aiAnalysis ? {
        sentiment: aiAnalysis.sentiment,
        category: aiAnalysis.category,
        confidence: aiAnalysis.confidenceScore,
        summary: aiAnalysis.summary,
        suggested_action: aiAnalysis.suggestedAction,
        requires_attention: requiresImmediateAttention(aiAnalysis)
      } : null
    });
    
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for testing
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'SendGrid inbound webhook endpoint',
    timestamp: new Date().toISOString()
  });
}
