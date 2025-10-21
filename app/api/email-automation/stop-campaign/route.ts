/**
 * STOP CAMPAIGN AUTOMATION
 * 
 * Safely stops a campaign by cancelling all pending emails
 * while preserving sent emails and audit trail.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

interface StopCampaignRequest {
  campaignId: string;
  reason?: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body: StopCampaignRequest = await request.json();
    const { campaignId, reason = 'Manually stopped by user' } = body;
    
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID required' },
        { status: 400 }
      );
    }
    
    const supabase = supabaseAdmin();
    const userId = session.user.id;
    
    // Verify campaign ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('cold_outreach_email_campaigns')
      .select('id, status')
      .eq('id', campaignId)
      .eq('user_id', userId)
      .single();
    
    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    // Get stats before cancelling
    const { data: pendingEmails } = await supabase
      .from('cold_outreach_email_queue')
      .select('id, status')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');
    
    const { data: sentEmails } = await supabase
      .from('cold_outreach_email_queue')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('status', 'sent');
    
    // Cancel all pending emails
    const { error: cancelError } = await supabase
      .from('cold_outreach_email_queue')
      .update({
        status: 'cancelled',
        error_message: reason,
        updated_at: new Date().toISOString()
      })
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');
    
    if (cancelError) {
      console.error('Error cancelling emails:', cancelError);
      return NextResponse.json(
        { error: 'Failed to cancel emails: ' + cancelError.message },
        { status: 500 }
      );
    }
    
    // Update campaign status
    await supabase
      .from('cold_outreach_email_campaigns')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId);
    
    // Log the stop
    await supabase.from('cold_outreach_email_log').insert({
      user_id: userId,
      campaign_id: campaignId,
      event_type: 'cancelled',
      message: `Campaign stopped: ${pendingEmails?.length || 0} pending emails cancelled`,
      metadata: {
        reason,
        emails_cancelled: pendingEmails?.length || 0,
        emails_already_sent: sentEmails?.length || 0
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Campaign stopped successfully',
      stats: {
        emails_cancelled: pendingEmails?.length || 0,
        emails_already_sent: sentEmails?.length || 0
      }
    });
    
  } catch (error: any) {
    console.error('Error stopping campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
