/**
 * MONITORING & ALERTING SYSTEM
 * 
 * Real-time monitoring, health checks, and alerting for email automation.
 * Ensures system reliability and immediate notification of issues.
 */

import { supabaseAdmin } from '@/lib/supabase';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: CheckStatus;
    emailQueue: CheckStatus;
    sendingSchedule: CheckStatus;
    responseTracking: CheckStatus;
    rateLimits: CheckStatus;
  };
  metrics: SystemMetrics;
  alerts: Alert[];
}

interface CheckStatus {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: any;
}

interface SystemMetrics {
  emailsInQueue: number;
  emailsSentToday: number;
  emailsSentLast24h: number;
  failureRateLast24h: number;
  responseRateLast24h: number;
  averageSendTime: number;
  deadLetterQueueSize: number;
}

interface Alert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  metadata?: any;
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const timestamp = new Date().toISOString();
  const alerts: Alert[] = [];
  
  // Check database connectivity
  const databaseCheck = await checkDatabase();
  if (databaseCheck.status === 'fail') {
    alerts.push({
      severity: 'critical',
      message: 'Database connection failed',
      timestamp,
      metadata: databaseCheck.details
    });
  }
  
  // Check email queue health
  const queueCheck = await checkEmailQueue();
  if (queueCheck.status === 'fail') {
    alerts.push({
      severity: 'high',
      message: queueCheck.message,
      timestamp,
      metadata: queueCheck.details
    });
  } else if (queueCheck.status === 'warn') {
    alerts.push({
      severity: 'medium',
      message: queueCheck.message,
      timestamp,
      metadata: queueCheck.details
    });
  }
  
  // Check sending schedule
  const scheduleCheck = await checkSendingSchedule();
  if (scheduleCheck.status === 'fail') {
    alerts.push({
      severity: 'high',
      message: scheduleCheck.message,
      timestamp,
      metadata: scheduleCheck.details
    });
  }
  
  // Check response tracking
  const responseCheck = await checkResponseTracking();
  if (responseCheck.status === 'warn') {
    alerts.push({
      severity: 'low',
      message: responseCheck.message,
      timestamp,
      metadata: responseCheck.details
    });
  }
  
  // Check rate limits
  const rateLimitCheck = await checkRateLimits();
  if (rateLimitCheck.status === 'fail') {
    alerts.push({
      severity: 'critical',
      message: rateLimitCheck.message,
      timestamp,
      metadata: rateLimitCheck.details
    });
  }
  
  // Get system metrics
  const metrics = await getSystemMetrics();
  
  // Check for anomalies in metrics
  const metricAlerts = checkMetricAnomalies(metrics);
  alerts.push(...metricAlerts);
  
  // Determine overall status
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (alerts.some(a => a.severity === 'critical')) {
    overallStatus = 'unhealthy';
  } else if (alerts.some(a => a.severity === 'high' || a.severity === 'medium')) {
    overallStatus = 'degraded';
  }
  
  return {
    status: overallStatus,
    timestamp,
    checks: {
      database: databaseCheck,
      emailQueue: queueCheck,
      sendingSchedule: scheduleCheck,
      responseTracking: responseCheck,
      rateLimits: rateLimitCheck
    },
    metrics,
    alerts
  };
}

/**
 * Check database connectivity and performance
 */
async function checkDatabase(): Promise<CheckStatus> {
  try {
    const supabase = supabaseAdmin();
    const start = Date.now();
    
    const { error } = await supabase
      .from('cold_outreach_email_queue')
      .select('id')
      .limit(1);
    
    const duration = Date.now() - start;
    
    if (error) {
      return {
        status: 'fail',
        message: 'Database query failed',
        details: { error: error.message }
      };
    }
    
    if (duration > 1000) {
      return {
        status: 'warn',
        message: `Database response slow: ${duration}ms`,
        details: { duration }
      };
    }
    
    return {
      status: 'pass',
      message: `Database healthy (${duration}ms)`,
      details: { duration }
    };
    
  } catch (error: any) {
    return {
      status: 'fail',
      message: 'Database connection error',
      details: { error: error.message }
    };
  }
}

/**
 * Check email queue health
 */
async function checkEmailQueue(): Promise<CheckStatus> {
  try {
    const supabase = supabaseAdmin();
    
    // Get queue stats
    const { data: emails } = await supabase
      .from('cold_outreach_email_queue')
      .select('status, scheduled_for, created_at')
      .in('status', ['pending', 'sending', 'failed']);
    
    if (!emails) {
      return {
        status: 'fail',
        message: 'Failed to fetch queue stats',
        details: {}
      };
    }
    
    const pending = emails.filter(e => e.status === 'pending').length;
    const sending = emails.filter(e => e.status === 'sending').length;
    const failed = emails.filter(e => e.status === 'failed').length;
    
    // Check for stuck emails (sending for > 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const stuckEmails = emails.filter(e => 
      e.status === 'sending' && 
      new Date(e.created_at) < fiveMinutesAgo
    ).length;
    
    if (stuckEmails > 0) {
      return {
        status: 'fail',
        message: `${stuckEmails} emails stuck in 'sending' status`,
        details: { pending, sending, failed, stuck: stuckEmails }
      };
    }
    
    // Check for high failure rate
    const total = pending + sending + failed;
    const failureRate = total > 0 ? failed / total : 0;
    
    if (failureRate > 0.1) {
      return {
        status: 'warn',
        message: `High failure rate: ${(failureRate * 100).toFixed(1)}%`,
        details: { pending, sending, failed, failure_rate: failureRate }
      };
    }
    
    return {
      status: 'pass',
      message: `Queue healthy: ${pending} pending, ${sending} sending, ${failed} failed`,
      details: { pending, sending, failed }
    };
    
  } catch (error: any) {
    return {
      status: 'fail',
      message: 'Error checking email queue',
      details: { error: error.message }
    };
  }
}

/**
 * Check sending schedule compliance
 */
async function checkSendingSchedule(): Promise<CheckStatus> {
  try {
    const supabase = supabaseAdmin();
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's schedules
    const { data: schedules } = await supabase
      .from('cold_outreach_sending_schedule')
      .select('*')
      .eq('send_date', today);
    
    if (!schedules) {
      return {
        status: 'pass',
        message: 'No active schedules today',
        details: {}
      };
    }
    
    // Check for rate limit violations
    const violations = schedules.filter(s => 
      s.emails_sent_today > s.max_emails_per_day
    );
    
    if (violations.length > 0) {
      return {
        status: 'fail',
        message: `${violations.length} users exceeded daily rate limit`,
        details: { violations: violations.length }
      };
    }
    
    // Check for users close to limit
    const nearLimit = schedules.filter(s => 
      s.emails_sent_today >= s.max_emails_per_day * 0.9
    );
    
    return {
      status: 'pass',
      message: `${schedules.length} active schedules, ${nearLimit.length} near limit`,
      details: { 
        total_schedules: schedules.length,
        near_limit: nearLimit.length
      }
    };
    
  } catch (error: any) {
    return {
      status: 'fail',
      message: 'Error checking sending schedule',
      details: { error: error.message }
    };
  }
}

/**
 * Check response tracking system
 */
async function checkResponseTracking(): Promise<CheckStatus> {
  try {
    const supabase = supabaseAdmin();
    
    // Get unprocessed responses
    const { data: unprocessed } = await supabase
      .from('cold_outreach_email_responses')
      .select('id, created_at')
      .eq('processed', false);
    
    if (!unprocessed) {
      return {
        status: 'pass',
        message: 'Response tracking operational',
        details: {}
      };
    }
    
    // Check for old unprocessed responses (> 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oldUnprocessed = unprocessed.filter(r => 
      new Date(r.created_at) < oneHourAgo
    ).length;
    
    if (oldUnprocessed > 0) {
      return {
        status: 'warn',
        message: `${oldUnprocessed} responses unprocessed for > 1 hour`,
        details: { unprocessed: unprocessed.length, old: oldUnprocessed }
      };
    }
    
    return {
      status: 'pass',
      message: `Response tracking healthy: ${unprocessed.length} pending`,
      details: { unprocessed: unprocessed.length }
    };
    
  } catch (error: any) {
    return {
      status: 'fail',
      message: 'Error checking response tracking',
      details: { error: error.message }
    };
  }
}

/**
 * Check rate limit compliance
 */
async function checkRateLimits(): Promise<CheckStatus> {
  try {
    const supabase = supabaseAdmin();
    
    // Get rate limit tracking records
    const { data: tracking } = await supabase
      .from('cold_outreach_rate_limit_tracking')
      .select('*')
      .eq('limit_exceeded', true)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    if (tracking && tracking.length > 0) {
      return {
        status: 'fail',
        message: `${tracking.length} rate limit violations in last 24h`,
        details: { violations: tracking.length }
      };
    }
    
    return {
      status: 'pass',
      message: 'No rate limit violations',
      details: {}
    };
    
  } catch (error: any) {
    return {
      status: 'fail',
      message: 'Error checking rate limits',
      details: { error: error.message }
    };
  }
}

/**
 * Get system metrics
 */
async function getSystemMetrics(): Promise<SystemMetrics> {
  const supabase = supabaseAdmin();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  
  try {
    // Emails in queue
    const { data: queueEmails } = await supabase
      .from('cold_outreach_email_queue')
      .select('status')
      .eq('status', 'pending');
    
    // Emails sent today
    const { data: todaySchedules } = await supabase
      .from('cold_outreach_sending_schedule')
      .select('emails_sent_today')
      .eq('send_date', today);
    
    const emailsSentToday = todaySchedules?.reduce((sum, s) => sum + s.emails_sent_today, 0) || 0;
    
    // Emails sent last 24h
    const { data: last24hEmails } = await supabase
      .from('cold_outreach_email_queue')
      .select('status, sent_at')
      .eq('status', 'sent')
      .gte('sent_at', last24h);
    
    // Failed emails last 24h
    const { data: failedEmails } = await supabase
      .from('cold_outreach_email_queue')
      .select('status')
      .eq('status', 'failed')
      .gte('created_at', last24h);
    
    const totalLast24h = (last24hEmails?.length || 0) + (failedEmails?.length || 0);
    const failureRate = totalLast24h > 0 
      ? (failedEmails?.length || 0) / totalLast24h 
      : 0;
    
    // Responses last 24h
    const { data: responses } = await supabase
      .from('cold_outreach_email_responses')
      .select('id')
      .gte('created_at', last24h);
    
    const responseRate = (last24hEmails?.length || 0) > 0
      ? (responses?.length || 0) / (last24hEmails?.length || 0)
      : 0;
    
    // Dead letter queue size
    const { data: dlq } = await supabase
      .from('cold_outreach_dead_letter_queue')
      .select('id')
      .eq('resolved', false);
    
    return {
      emailsInQueue: queueEmails?.length || 0,
      emailsSentToday,
      emailsSentLast24h: last24hEmails?.length || 0,
      failureRateLast24h: failureRate,
      responseRateLast24h: responseRate,
      averageSendTime: 0, // TODO: Calculate from logs
      deadLetterQueueSize: dlq?.length || 0
    };
    
  } catch (error) {
    console.error('Error getting system metrics:', error);
    return {
      emailsInQueue: 0,
      emailsSentToday: 0,
      emailsSentLast24h: 0,
      failureRateLast24h: 0,
      responseRateLast24h: 0,
      averageSendTime: 0,
      deadLetterQueueSize: 0
    };
  }
}

/**
 * Check for metric anomalies
 */
function checkMetricAnomalies(metrics: SystemMetrics): Alert[] {
  const alerts: Alert[] = [];
  const timestamp = new Date().toISOString();
  
  // High failure rate
  if (metrics.failureRateLast24h > 0.1) {
    alerts.push({
      severity: 'high',
      message: `High failure rate: ${(metrics.failureRateLast24h * 100).toFixed(1)}%`,
      timestamp,
      metadata: { failure_rate: metrics.failureRateLast24h }
    });
  }
  
  // Large dead letter queue
  if (metrics.deadLetterQueueSize > 50) {
    alerts.push({
      severity: 'medium',
      message: `Large dead letter queue: ${metrics.deadLetterQueueSize} emails`,
      timestamp,
      metadata: { dlq_size: metrics.deadLetterQueueSize }
    });
  }
  
  // Low response rate (if sending emails)
  if (metrics.emailsSentLast24h > 10 && metrics.responseRateLast24h < 0.01) {
    alerts.push({
      severity: 'low',
      message: `Low response rate: ${(metrics.responseRateLast24h * 100).toFixed(1)}%`,
      timestamp,
      metadata: { response_rate: metrics.responseRateLast24h }
    });
  }
  
  return alerts;
}

/**
 * Send alert notification
 */
export async function sendAlert(alert: Alert): Promise<void> {
  try {
    // TODO: Implement Slack webhook
    // const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    // if (slackWebhookUrl) {
    //   await fetch(slackWebhookUrl, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       text: `🚨 ${alert.severity.toUpperCase()}: ${alert.message}`,
    //       attachments: [{
    //         color: alert.severity === 'critical' ? 'danger' : 'warning',
    //         fields: Object.entries(alert.metadata || {}).map(([key, value]) => ({
    //           title: key,
    //           value: String(value),
    //           short: true
    //         }))
    //       }]
    //     })
    //   });
    // }
    
    // For now, log to console
    console.error(`[ALERT ${alert.severity.toUpperCase()}] ${alert.message}`, alert.metadata);
    
    // Log to database
    const supabase = supabaseAdmin();
    await supabase.from('cold_outreach_email_log').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // System user
      event_type: 'failed',
      message: `System alert: ${alert.message}`,
      metadata: {
        severity: alert.severity,
        ...alert.metadata
      }
    });
    
  } catch (error) {
    console.error('Failed to send alert:', error);
  }
}

/**
 * Generate daily health report
 */
export async function generateDailyReport(): Promise<string> {
  const health = await performHealthCheck();
  const metrics = health.metrics;
  
  const report = `
📊 Email Automation Daily Report
${new Date().toISOString().split('T')[0]}

System Status: ${health.status.toUpperCase()}

📈 Metrics:
• Emails sent today: ${metrics.emailsSentToday}
• Emails sent (24h): ${metrics.emailsSentLast24h}
• Emails in queue: ${metrics.emailsInQueue}
• Failure rate: ${(metrics.failureRateLast24h * 100).toFixed(1)}%
• Response rate: ${(metrics.responseRateLast24h * 100).toFixed(1)}%
• Dead letter queue: ${metrics.deadLetterQueueSize}

✅ Health Checks:
• Database: ${health.checks.database.status} - ${health.checks.database.message}
• Email Queue: ${health.checks.emailQueue.status} - ${health.checks.emailQueue.message}
• Sending Schedule: ${health.checks.sendingSchedule.status} - ${health.checks.sendingSchedule.message}
• Response Tracking: ${health.checks.responseTracking.status} - ${health.checks.responseTracking.message}
• Rate Limits: ${health.checks.rateLimits.status} - ${health.checks.rateLimits.message}

${health.alerts.length > 0 ? `
🚨 Alerts (${health.alerts.length}):
${health.alerts.map(a => `• [${a.severity.toUpperCase()}] ${a.message}`).join('\n')}
` : '✅ No alerts'}

Generated at: ${health.timestamp}
  `.trim();
  
  return report;
}
