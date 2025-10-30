/**
 * CAMPAIGN STATISTICS API
 * 
 * Provides real-time stats and analytics for email campaigns
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Helper to get user (NextAuth or dev cookie)
async function getUser() {
  const session = await getServerSession(authOptions);
  
  if (session?.user) {
    return session.user;
  }
  
  // Fallback to dev cookie
  const cookieStore = await cookies();
  const devUserId = cookieStore.get('dev-user-id')?.value;
  if (devUserId) {
    return { id: devUserId } as any;
  }
  
  return null;
}

export async function GET(request: Request) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    
    const supabase = supabaseAdmin();
    const userId = user.id;
    
    if (campaignId) {
      // Get stats for specific campaign
      const { data: campaign } = await supabase
        .from('cold_outreach_campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('user_id', userId)
        .single();
      
      if (!campaign) {
        return NextResponse.json(
          { error: 'Campaign not found' },
          { status: 404 }
        );
      }
      
      // Get email stats
      const { data: emails } = await supabase
        .from('cold_outreach_email_queue')
        .select('status, is_follow_up, follow_up_number, scheduled_for, sent_at, recipient_email')
        .eq('campaign_id', campaignId);
      
      const total = emails?.length || 0;
      const pending = emails?.filter(e => e.status === 'pending').length || 0;
      const sent = emails?.filter(e => e.status === 'sent').length || 0;
      const failed = emails?.filter(e => e.status === 'failed').length || 0;
      const cancelled = emails?.filter(e => e.status === 'cancelled').length || 0;
      const responseReceived = emails?.filter(e => e.status === 'response_received').length || 0;
      
      // Get response stats
      const { data: responses } = await supabase
        .from('cold_outreach_email_responses')
        .select('*')
        .eq('campaign_id', campaignId);
      
      const responseCount = responses?.length || 0;
      const responseRate = sent > 0 ? (responseCount / sent) * 100 : 0;
      
      // Get today's sending stats
      const today = new Date().toISOString().split('T')[0];
      const { data: todaySchedule } = await supabase
        .from('cold_outreach_sending_schedule')
        .select('*')
        .eq('user_id', userId)
        .eq('send_date', today)
        .single();
      
      // Get next scheduled email
      const nextEmail = emails
        ?.filter(e => e.status === 'pending')
        .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())[0];
      
      // Get recent activity
      const { data: recentLogs } = await supabase
        .from('cold_outreach_email_log')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      return NextResponse.json({
        campaign: {
          id: campaign.id,
          name: campaign.name || 'Unnamed Campaign',
          status: campaign.status
        },
        stats: {
          total_emails: total,
          pending,
          sent,
          failed,
          cancelled,
          response_received: responseReceived,
          response_count: responseCount,
          response_rate: responseRate.toFixed(1) + '%'
        },
        today: {
          emails_sent: todaySchedule?.emails_sent_today || 0,
          max_emails: todaySchedule?.max_emails_per_day || 28,
          remaining: (todaySchedule?.max_emails_per_day || 28) - (todaySchedule?.emails_sent_today || 0)
        },
        next_email: nextEmail ? {
          scheduled_for: nextEmail.scheduled_for,
          recipient: nextEmail.recipient_email,
          is_follow_up: nextEmail.is_follow_up,
          follow_up_number: nextEmail.follow_up_number
        } : null,
        recent_activity: recentLogs || []
      });
      
    } else {
      // Get overall stats for user
      const { data: allEmails } = await supabase
        .from('cold_outreach_email_queue')
        .select('status, campaign_id')
        .eq('user_id', userId);
      
      const { data: allResponses } = await supabase
        .from('cold_outreach_email_responses')
        .select('campaign_id')
        .eq('user_id', userId);
      
      const { data: campaigns } = await supabase
        .from('cold_outreach_email_campaigns')
        .select('id, status')
        .eq('user_id', userId);
      
      const today = new Date().toISOString().split('T')[0];
      const { data: todaySchedule } = await supabase
        .from('cold_outreach_sending_schedule')
        .select('*')
        .eq('user_id', userId)
        .eq('send_date', today)
        .single();
      
      return NextResponse.json({
        overall: {
          total_campaigns: campaigns?.length || 0,
          active_campaigns: campaigns?.filter(c => c.status === 'active').length || 0,
          total_emails: allEmails?.length || 0,
          sent: allEmails?.filter(e => e.status === 'sent').length || 0,
          pending: allEmails?.filter(e => e.status === 'pending').length || 0,
          responses: allResponses?.length || 0
        },
        today: {
          emails_sent: todaySchedule?.emails_sent_today || 0,
          max_emails: todaySchedule?.max_emails_per_day || 28,
          remaining: (todaySchedule?.max_emails_per_day || 28) - (todaySchedule?.emails_sent_today || 0)
        }
      });
    }
    
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
