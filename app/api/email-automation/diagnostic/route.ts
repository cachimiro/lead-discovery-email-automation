/**
 * DIAGNOSTIC ENDPOINT
 * 
 * Provides detailed information about email automation status
 * Helps troubleshoot why emails aren't sending
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const supabase = supabaseAdmin();
    const now = new Date();
    
    // Get user profile
    const { data: profile } = await supabase
      .from('cold_outreach_user_profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();
    
    // Get OAuth tokens
    const { data: tokens } = await supabase
      .from('cold_outreach_oauth_tokens')
      .select('provider, token_type, expires_at, created_at, updated_at')
      .eq('user_id', userId)
      .single();
    
    // Get latest campaign
    const { data: campaign } = await supabase
      .from('cold_outreach_campaigns')
      .select('id, name, status, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Get email queue stats
    const { data: queueStats } = await supabase
      .from('cold_outreach_email_queue')
      .select('status, scheduled_for')
      .eq('user_id', userId);
    
    // Count by status
    const statusCounts = queueStats?.reduce((acc: any, email: any) => {
      acc[email.status] = (acc[email.status] || 0) + 1;
      return acc;
    }, {}) || {};
    
    // Get pending emails that should send now
    const pendingEmails = queueStats?.filter(
      (e: any) => e.status === 'pending'
    ) || [];
    
    const shouldSendNow = pendingEmails.filter(
      (e: any) => new Date(e.scheduled_for) <= now
    );
    
    const scheduledForFuture = pendingEmails.filter(
      (e: any) => new Date(e.scheduled_for) > now
    );
    
    // Get earliest and latest scheduled times
    const scheduledTimes = pendingEmails.map((e: any) => new Date(e.scheduled_for));
    const earliestScheduled = scheduledTimes.length > 0 
      ? new Date(Math.min(...scheduledTimes.map(d => d.getTime())))
      : null;
    const latestScheduled = scheduledTimes.length > 0
      ? new Date(Math.max(...scheduledTimes.map(d => d.getTime())))
      : null;
    
    // Get recent logs
    const { data: recentLogs } = await supabase
      .from('cold_outreach_email_log')
      .select('event_type, message, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    // Check if CRON_SECRET is set
    const cronSecretSet = !!process.env.CRON_SECRET;
    
    // Determine issues
    const issues: string[] = [];
    const warnings: string[] = [];
    
    if (!profile?.email) {
      issues.push('User email not found in profile');
    }
    
    if (!tokens) {
      issues.push('No OAuth tokens found - user needs to sign in with Google/Microsoft');
    } else if (tokens.expires_at && new Date(tokens.expires_at) < now) {
      warnings.push('OAuth token may be expired - user should re-authenticate');
    }
    
    if (!campaign) {
      warnings.push('No campaigns found');
    } else if (campaign.status !== 'active') {
      warnings.push(`Campaign status is "${campaign.status}" - should be "active"`);
    }
    
    if (pendingEmails.length === 0) {
      warnings.push('No pending emails in queue');
    }
    
    if (shouldSendNow.length > 0) {
      warnings.push(`${shouldSendNow.length} emails are past their scheduled time but not sent - check cron job`);
    }
    
    if (!cronSecretSet) {
      issues.push('CRON_SECRET environment variable not set');
    }
    
    // Overall status
    let status = 'healthy';
    if (issues.length > 0) {
      status = 'error';
    } else if (warnings.length > 0) {
      status = 'warning';
    }
    
    return NextResponse.json({
      status,
      timestamp: now.toISOString(),
      issues,
      warnings,
      user: {
        id: userId,
        email: profile?.email || 'NOT FOUND',
        name: profile?.full_name || 'Unknown'
      },
      oauth: tokens ? {
        provider: tokens.provider,
        tokenType: tokens.token_type,
        expiresAt: tokens.expires_at,
        isExpired: tokens.expires_at ? new Date(tokens.expires_at) < now : false,
        lastUpdated: tokens.updated_at
      } : null,
      campaign: campaign ? {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        createdAt: campaign.created_at,
        updatedAt: campaign.updated_at
      } : null,
      emailQueue: {
        total: queueStats?.length || 0,
        byStatus: statusCounts,
        pending: {
          total: pendingEmails.length,
          shouldSendNow: shouldSendNow.length,
          scheduledForFuture: scheduledForFuture.length,
          earliestScheduled: earliestScheduled?.toISOString() || null,
          latestScheduled: latestScheduled?.toISOString() || null
        }
      },
      recentActivity: recentLogs || [],
      environment: {
        cronSecretSet,
        nodeEnv: process.env.NODE_ENV
      },
      nextSteps: issues.length > 0 
        ? ['Fix critical issues listed above']
        : warnings.length > 0
        ? ['Review warnings and take action if needed']
        : shouldSendNow.length > 0
        ? ['Emails are ready to send - verify cron job is running']
        : scheduledForFuture.length > 0
        ? [`Wait until ${earliestScheduled?.toLocaleString()} for first email to send`]
        : ['Create a campaign and start it to queue emails']
    });
    
  } catch (error: any) {
    console.error('Diagnostic error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
