/**
 * BULLETPROOF ERROR HANDLING SYSTEM
 * 
 * 5-Tier error recovery with automatic retry, dead letter queue,
 * and comprehensive logging. Designed for zero data loss.
 */

import { supabaseAdmin } from '@/lib/supabase';

// Error types and their handling strategies
export enum ErrorType {
  TRANSIENT = 'transient',           // Network timeouts, temporary API errors
  RATE_LIMIT = 'rate_limit',         // API rate limits hit
  AUTHENTICATION = 'authentication',  // OAuth token expired
  VALIDATION = 'validation',          // Invalid email format, missing data
  PERMANENT = 'permanent',            // Recipient doesn't exist, blocked
  UNKNOWN = 'unknown'                 // Unexpected errors
}

export enum ErrorSeverity {
  LOW = 'low',           // Log only
  MEDIUM = 'medium',     // Log + retry
  HIGH = 'high',         // Log + retry + alert
  CRITICAL = 'critical'  // Log + retry + alert + pause campaign
}

interface ErrorContext {
  emailQueueId: string;
  userId: string;
  campaignId: string;
  attemptNumber: number;
  error: Error;
  metadata?: Record<string, any>;
}

interface RetryConfig {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelayMs: number;
  maxDelayMs: number;
}

/**
 * Classify error type based on error details
 */
export function classifyError(error: any): ErrorType {
  const message = error.message?.toLowerCase() || '';
  const code = error.code || '';
  const status = error.status || error.statusCode || 0;

  // Network/timeout errors
  if (
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'ENOTFOUND' ||
    status === 503 ||
    status === 504
  ) {
    return ErrorType.TRANSIENT;
  }

  // Rate limiting
  if (status === 429 || message.includes('rate limit')) {
    return ErrorType.RATE_LIMIT;
  }

  // Authentication issues
  if (
    status === 401 ||
    status === 403 ||
    message.includes('unauthorized') ||
    message.includes('token expired')
  ) {
    return ErrorType.AUTHENTICATION;
  }

  // Validation errors
  if (
    status === 400 ||
    message.includes('invalid email') ||
    message.includes('validation')
  ) {
    return ErrorType.VALIDATION;
  }

  // Permanent failures
  if (
    status === 404 ||
    message.includes('recipient not found') ||
    message.includes('blocked') ||
    message.includes('bounced')
  ) {
    return ErrorType.PERMANENT;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Determine error severity
 */
export function getErrorSeverity(errorType: ErrorType, attemptNumber: number): ErrorSeverity {
  // First attempt failures are less severe
  if (attemptNumber === 1) {
    if (errorType === ErrorType.TRANSIENT) return ErrorSeverity.LOW;
    if (errorType === ErrorType.RATE_LIMIT) return ErrorSeverity.MEDIUM;
  }

  // Multiple failures increase severity
  if (attemptNumber >= 3) {
    return ErrorSeverity.CRITICAL;
  }

  // Default severity by type
  switch (errorType) {
    case ErrorType.TRANSIENT:
      return ErrorSeverity.MEDIUM;
    case ErrorType.RATE_LIMIT:
      return ErrorSeverity.HIGH;
    case ErrorType.AUTHENTICATION:
      return ErrorSeverity.CRITICAL;
    case ErrorType.VALIDATION:
      return ErrorSeverity.HIGH;
    case ErrorType.PERMANENT:
      return ErrorSeverity.HIGH;
    default:
      return ErrorSeverity.HIGH;
  }
}

/**
 * Get retry configuration based on error type
 */
export function getRetryConfig(errorType: ErrorType): RetryConfig {
  switch (errorType) {
    case ErrorType.TRANSIENT:
      return {
        maxAttempts: 5,
        backoffStrategy: 'exponential',
        initialDelayMs: 1000,
        maxDelayMs: 60000
      };

    case ErrorType.RATE_LIMIT:
      return {
        maxAttempts: 10,
        backoffStrategy: 'exponential',
        initialDelayMs: 5000,
        maxDelayMs: 300000 // 5 minutes max
      };

    case ErrorType.AUTHENTICATION:
      return {
        maxAttempts: 2,
        backoffStrategy: 'fixed',
        initialDelayMs: 5000,
        maxDelayMs: 5000
      };

    case ErrorType.VALIDATION:
      return {
        maxAttempts: 1, // Don't retry validation errors
        backoffStrategy: 'fixed',
        initialDelayMs: 0,
        maxDelayMs: 0
      };

    case ErrorType.PERMANENT:
      return {
        maxAttempts: 1, // Don't retry permanent failures
        backoffStrategy: 'fixed',
        initialDelayMs: 0,
        maxDelayMs: 0
      };

    default:
      return {
        maxAttempts: 3,
        backoffStrategy: 'exponential',
        initialDelayMs: 2000,
        maxDelayMs: 30000
      };
  }
}

/**
 * Calculate delay for next retry attempt
 */
export function calculateRetryDelay(
  attemptNumber: number,
  config: RetryConfig,
  retryAfterHeader?: number
): number {
  // Respect Retry-After header if provided
  if (retryAfterHeader) {
    return Math.min(retryAfterHeader * 1000, config.maxDelayMs);
  }

  let delay: number;

  switch (config.backoffStrategy) {
    case 'linear':
      delay = config.initialDelayMs * attemptNumber;
      break;

    case 'exponential':
      delay = config.initialDelayMs * Math.pow(2, attemptNumber - 1);
      break;

    case 'fixed':
    default:
      delay = config.initialDelayMs;
      break;
  }

  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay;
  delay = delay + jitter;

  return Math.min(delay, config.maxDelayMs);
}

/**
 * Log error to database
 */
export async function logError(context: ErrorContext): Promise<void> {
  const errorType = classifyError(context.error);
  const severity = getErrorSeverity(errorType, context.attemptNumber);

  try {
    const supabase = supabaseAdmin();

    // Log to email_log table
    await supabase.from('cold_outreach_email_log').insert({
      user_id: context.userId,
      email_queue_id: context.emailQueueId,
      event_type: 'failed',
      message: `Attempt ${context.attemptNumber} failed: ${context.error.message}`,
      metadata: {
        error_type: errorType,
        severity,
        attempt_number: context.attemptNumber,
        stack_trace: context.error.stack,
        ...context.metadata
      }
    });

    // Update email queue status
    await supabase
      .from('cold_outreach_email_queue')
      .update({
        status: 'failed',
        error_message: context.error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', context.emailQueueId);

  } catch (logError) {
    // If logging fails, at least log to console
    console.error('Failed to log error to database:', logError);
    console.error('Original error:', context.error);
  }
}

/**
 * Move email to dead letter queue
 */
export async function moveToDeadLetterQueue(context: ErrorContext): Promise<void> {
  const supabase = supabaseAdmin();

  try {
    // Get email details
    const { data: email } = await supabase
      .from('cold_outreach_email_queue')
      .select('*')
      .eq('id', context.emailQueueId)
      .single();

    if (!email) {
      throw new Error(`Email ${context.emailQueueId} not found`);
    }

    // Create DLQ table if it doesn't exist (should be in migrations)
    await supabase.from('cold_outreach_dead_letter_queue').insert({
      email_queue_id: context.emailQueueId,
      user_id: context.userId,
      campaign_id: context.campaignId,
      recipient_email: email.recipient_email,
      subject: email.subject,
      body: email.body,
      error_type: classifyError(context.error),
      error_message: context.error.message,
      retry_count: context.attemptNumber,
      original_scheduled_for: email.scheduled_for,
      metadata: {
        stack_trace: context.error.stack,
        ...context.metadata
      }
    });

    // Update original email status
    await supabase
      .from('cold_outreach_email_queue')
      .update({
        status: 'failed',
        error_message: `Moved to DLQ after ${context.attemptNumber} attempts`,
        updated_at: new Date().toISOString()
      })
      .eq('id', context.emailQueueId);

    // Log the move
    await supabase.from('cold_outreach_email_log').insert({
      user_id: context.userId,
      email_queue_id: context.emailQueueId,
      event_type: 'failed',
      message: `Moved to dead letter queue after ${context.attemptNumber} failed attempts`,
      metadata: {
        error_type: classifyError(context.error),
        final_error: context.error.message
      }
    });

    console.log(`Email ${context.emailQueueId} moved to dead letter queue`);

  } catch (error) {
    console.error('Failed to move email to DLQ:', error);
    throw error;
  }
}

/**
 * Send alert based on error severity
 */
export async function sendAlert(
  context: ErrorContext,
  severity: ErrorSeverity
): Promise<void> {
  // Only alert on HIGH and CRITICAL severity
  if (severity !== ErrorSeverity.HIGH && severity !== ErrorSeverity.CRITICAL) {
    return;
  }

  const errorType = classifyError(context.error);
  const message = `
🚨 Email Automation Alert

Severity: ${severity.toUpperCase()}
Error Type: ${errorType}
Email ID: ${context.emailQueueId}
Campaign ID: ${context.campaignId}
Attempt: ${context.attemptNumber}
Error: ${context.error.message}

${severity === ErrorSeverity.CRITICAL ? '⚠️ Campaign may need to be paused' : ''}
  `.trim();

  try {
    // TODO: Implement Slack webhook
    // await fetch(process.env.SLACK_WEBHOOK_URL!, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ text: message })
    // });

    // For now, log to console
    console.error(message);

    // Also log to database
    const supabase = supabaseAdmin();
    await supabase.from('cold_outreach_email_log').insert({
      user_id: context.userId,
      email_queue_id: context.emailQueueId,
      event_type: 'failed',
      message: `Alert sent: ${severity}`,
      metadata: {
        alert_message: message,
        error_type: errorType
      }
    });

  } catch (error) {
    console.error('Failed to send alert:', error);
  }
}

/**
 * Check if campaign should be paused due to high failure rate
 */
export async function checkCampaignHealth(
  campaignId: string,
  userId: string
): Promise<{ shouldPause: boolean; reason?: string }> {
  const supabase = supabaseAdmin();

  try {
    // Get emails sent in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recentEmails } = await supabase
      .from('cold_outreach_email_queue')
      .select('status')
      .eq('campaign_id', campaignId)
      .gte('created_at', oneHourAgo);

    if (!recentEmails || recentEmails.length === 0) {
      return { shouldPause: false };
    }

    const totalEmails = recentEmails.length;
    const failedEmails = recentEmails.filter(e => e.status === 'failed').length;
    const failureRate = failedEmails / totalEmails;

    // Pause if > 10% failure rate
    if (failureRate > 0.1) {
      return {
        shouldPause: true,
        reason: `High failure rate: ${(failureRate * 100).toFixed(1)}% (${failedEmails}/${totalEmails} emails failed in last hour)`
      };
    }

    // Pause if > 5 consecutive failures
    const { data: lastFive } = await supabase
      .from('cold_outreach_email_queue')
      .select('status')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (lastFive && lastFive.length === 5) {
      const allFailed = lastFive.every(e => e.status === 'failed');
      if (allFailed) {
        return {
          shouldPause: true,
          reason: '5 consecutive email failures detected'
        };
      }
    }

    return { shouldPause: false };

  } catch (error) {
    console.error('Error checking campaign health:', error);
    return { shouldPause: false };
  }
}

/**
 * Pause campaign due to errors
 */
export async function pauseCampaign(
  campaignId: string,
  userId: string,
  reason: string
): Promise<void> {
  const supabase = supabaseAdmin();

  try {
    // Update campaign status
    await supabase
      .from('cold_outreach_email_campaigns')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('user_id', userId);

    // Cancel all pending emails
    await supabase
      .from('cold_outreach_email_queue')
      .update({
        status: 'cancelled',
        error_message: `Campaign paused: ${reason}`,
        updated_at: new Date().toISOString()
      })
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');

    // Log the pause
    await supabase.from('cold_outreach_email_log').insert({
      user_id: userId,
      email_queue_id: null,
      event_type: 'cancelled',
      message: `Campaign paused automatically: ${reason}`,
      metadata: { campaign_id: campaignId, reason }
    });

    // Send critical alert
    await sendAlert(
      {
        emailQueueId: 'N/A',
        userId,
        campaignId,
        attemptNumber: 0,
        error: new Error(reason),
        metadata: { auto_paused: true }
      },
      ErrorSeverity.CRITICAL
    );

    console.log(`Campaign ${campaignId} paused: ${reason}`);

  } catch (error) {
    console.error('Failed to pause campaign:', error);
    throw error;
  }
}

/**
 * Main error handler - orchestrates all error handling logic
 */
export async function handleEmailError(context: ErrorContext): Promise<{
  shouldRetry: boolean;
  retryDelayMs?: number;
  movedToDLQ?: boolean;
}> {
  const errorType = classifyError(context.error);
  const severity = getErrorSeverity(errorType, context.attemptNumber);
  const retryConfig = getRetryConfig(errorType);

  // Log the error
  await logError(context);

  // Send alert if needed
  await sendAlert(context, severity);

  // Check if we should retry
  const shouldRetry = context.attemptNumber < retryConfig.maxAttempts;

  if (!shouldRetry) {
    // Move to dead letter queue
    await moveToDeadLetterQueue(context);

    // Check campaign health
    const health = await checkCampaignHealth(context.campaignId, context.userId);
    if (health.shouldPause) {
      await pauseCampaign(context.campaignId, context.userId, health.reason!);
    }

    return { shouldRetry: false, movedToDLQ: true };
  }

  // Calculate retry delay
  const retryDelayMs = calculateRetryDelay(
    context.attemptNumber,
    retryConfig,
    context.metadata?.retryAfter
  );

  console.log(
    `Will retry email ${context.emailQueueId} in ${retryDelayMs}ms (attempt ${context.attemptNumber + 1}/${retryConfig.maxAttempts})`
  );

  return { shouldRetry: true, retryDelayMs };
}

/**
 * Utility: Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Utility: Retry a function with error handling
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  context: ErrorContext
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      context.attemptNumber = attempt;
      context.error = error;

      const result = await handleEmailError(context);

      if (!result.shouldRetry) {
        throw error;
      }

      if (result.retryDelayMs) {
        await sleep(result.retryDelayMs);
      }
    }
  }

  throw lastError!;
}
