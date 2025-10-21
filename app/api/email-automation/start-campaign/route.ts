/**
 * START CAMPAIGN AUTOMATION
 * 
 * Activates email automation for a campaign, scheduling all emails
 * with rate limiting and follow-up logic.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

interface StartCampaignRequest {
  campaignId: string;
  maxEmailsPerDay?: number;
  sendingStartHour?: number;
  sendingEndHour?: number;
  followUpDelayDays?: number;
  skipWeekends?: boolean;
}

/**
 * Calculate next business day
 */
function getNextBusinessDay(date: Date, skipWeekends: boolean): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  
  if (skipWeekends) {
    while (next.getDay() === 0 || next.getDay() === 6) {
      next.setDate(next.getDate() + 1);
    }
  }
  
  return next;
}

/**
 * Calculate follow-up date (N business days later)
 */
function calculateFollowUpDate(
  sentDate: Date,
  delayDays: number,
  skipWeekends: boolean
): Date {
  let businessDaysAdded = 0;
  let currentDate = new Date(sentDate);
  
  while (businessDaysAdded < delayDays) {
    currentDate.setDate(currentDate.getDate() + 1);
    
    if (skipWeekends) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDaysAdded++;
      }
    } else {
      businessDaysAdded++;
    }
  }
  
  // Set to start hour
  currentDate.setHours(9, 0, 0, 0);
  
  return currentDate;
}

/**
 * Reserve email slot atomically
 */
async function reserveEmailSlot(
  userId: string,
  sendDate: Date
): Promise<{ success: boolean; scheduledTime?: Date }> {
  const supabase = supabaseAdmin();
  
  try {
    // Use the atomic function from database
    const { data, error } = await supabase.rpc('reserve_email_slot', {
      p_user_id: userId,
      p_send_date: sendDate.toISOString().split('T')[0]
    });
    
    if (error) throw error;
    
    if (data && data.length > 0 && data[0].slot_reserved) {
      return {
        success: true,
        scheduledTime: new Date(data[0].scheduled_time)
      };
    }
    
    return { success: false };
  } catch (error) {
    console.error('Error reserving email slot:', error);
    return { success: false };
  }
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
    
    const body: StartCampaignRequest = await request.json();
    const {
      campaignId,
      maxEmailsPerDay = 28,
      sendingStartHour = 9,
      sendingEndHour = 17,
      followUpDelayDays = 3,
      skipWeekends = true
    } = body;
    
    // Validation
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID required' },
        { status: 400 }
      );
    }
    
    if (maxEmailsPerDay < 1 || maxEmailsPerDay > 100) {
      return NextResponse.json(
        { error: 'Max emails per day must be between 1 and 100' },
        { status: 400 }
      );
    }
    
    if (sendingStartHour < 0 || sendingStartHour >= 24) {
      return NextResponse.json(
        { error: 'Invalid sending start hour' },
        { status: 400 }
      );
    }
    
    if (sendingEndHour <= sendingStartHour || sendingEndHour > 24) {
      return NextResponse.json(
        { error: 'Invalid sending end hour' },
        { status: 400 }
      );
    }
    
    const supabase = supabaseAdmin();
    const userId = session.user.id;
    
    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('cold_outreach_email_campaigns')
      .select('*, cold_outreach_contacts(*), cold_outreach_email_templates(*)')
      .eq('id', campaignId)
      .eq('user_id', userId)
      .single();
    
    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    // Check if campaign already has queued emails
    const { data: existingEmails } = await supabase
      .from('cold_outreach_email_queue')
      .select('id')
      .eq('campaign_id', campaignId)
      .limit(1);
    
    if (existingEmails && existingEmails.length > 0) {
      return NextResponse.json(
        { error: 'Campaign already has queued emails. Stop campaign first.' },
        { status: 400 }
      );
    }
    
    // Get enabled templates
    const enabledTemplates = campaign.cold_outreach_email_templates?.filter(
      (t: any) => t.is_enabled
    ) || [];
    
    if (enabledTemplates.length === 0) {
      return NextResponse.json(
        { error: 'No enabled email templates found' },
        { status: 400 }
      );
    }
    
    // Get contacts
    const contacts = campaign.cold_outreach_contacts || [];
    
    if (contacts.length === 0) {
      return NextResponse.json(
        { error: 'No contacts in campaign' },
        { status: 400 }
      );
    }
    
    // Schedule emails
    const emailsToQueue: any[] = [];
    let currentDate = new Date();
    
    // Start tomorrow if after sending hours
    const now = new Date();
    if (now.getHours() >= sendingEndHour) {
      currentDate = getNextBusinessDay(currentDate, skipWeekends);
    }
    
    // Set to start hour
    currentDate.setHours(sendingStartHour, 0, 0, 0);
    
    // Schedule first email for each contact
    for (const contact of contacts) {
      if (!contact.email) continue;
      
      const template = enabledTemplates.find((t: any) => t.template_number === 1);
      if (!template) continue;
      
      // Reserve slot
      const slot = await reserveEmailSlot(userId, currentDate);
      
      if (!slot.success) {
        // Move to next day
        currentDate = getNextBusinessDay(currentDate, skipWeekends);
        currentDate.setHours(sendingStartHour, 0, 0, 0);
        
        // Try again
        const retrySlot = await reserveEmailSlot(userId, currentDate);
        if (!retrySlot.success) {
          console.error('Failed to reserve slot for contact:', contact.email);
          continue;
        }
        
        emailsToQueue.push({
          user_id: userId,
          campaign_id: campaignId,
          recipient_email: contact.email,
          subject: template.subject,
          body: template.body,
          scheduled_for: retrySlot.scheduledTime!.toISOString(),
          status: 'pending',
          is_follow_up: false,
          follow_up_number: 1
        });
      } else {
        emailsToQueue.push({
          user_id: userId,
          campaign_id: campaignId,
          recipient_email: contact.email,
          subject: template.subject,
          body: template.body,
          scheduled_for: slot.scheduledTime!.toISOString(),
          status: 'pending',
          is_follow_up: false,
          follow_up_number: 1
        });
      }
    }
    
    // Insert emails into queue
    const { data: queuedEmails, error: queueError } = await supabase
      .from('cold_outreach_email_queue')
      .insert(emailsToQueue)
      .select();
    
    if (queueError) {
      console.error('Error queuing emails:', queueError);
      return NextResponse.json(
        { error: 'Failed to queue emails: ' + queueError.message },
        { status: 500 }
      );
    }
    
    // Schedule follow-ups if enabled
    const followUpEmails: any[] = [];
    
    for (let followUpNum = 2; followUpNum <= 3; followUpNum++) {
      const template = enabledTemplates.find((t: any) => t.template_number === followUpNum);
      if (!template) continue;
      
      for (const firstEmail of queuedEmails || []) {
        const followUpDate = calculateFollowUpDate(
          new Date(firstEmail.scheduled_for),
          followUpDelayDays,
          skipWeekends
        );
        
        followUpEmails.push({
          user_id: userId,
          campaign_id: campaignId,
          recipient_email: firstEmail.recipient_email,
          subject: template.subject,
          body: template.body,
          scheduled_for: followUpDate.toISOString(),
          status: 'pending',
          is_follow_up: true,
          follow_up_number: followUpNum,
          parent_email_id: firstEmail.id
        });
      }
    }
    
    if (followUpEmails.length > 0) {
      await supabase
        .from('cold_outreach_email_queue')
        .insert(followUpEmails);
    }
    
    // Update campaign status
    await supabase
      .from('cold_outreach_email_campaigns')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId);
    
    // Log the start
    await supabase.from('cold_outreach_email_log').insert({
      user_id: userId,
      campaign_id: campaignId,
      event_type: 'scheduled',
      message: `Campaign started: ${emailsToQueue.length} emails queued, ${followUpEmails.length} follow-ups scheduled`,
      metadata: {
        max_emails_per_day: maxEmailsPerDay,
        sending_hours: `${sendingStartHour}:00 - ${sendingEndHour}:00`,
        follow_up_delay_days: followUpDelayDays,
        skip_weekends: skipWeekends,
        total_emails: emailsToQueue.length + followUpEmails.length
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Campaign started successfully',
      stats: {
        emails_queued: emailsToQueue.length,
        follow_ups_scheduled: followUpEmails.length,
        total_emails: emailsToQueue.length + followUpEmails.length,
        first_send_date: queuedEmails?.[0]?.scheduled_for,
        estimated_completion_date: queuedEmails?.[queuedEmails.length - 1]?.scheduled_for
      }
    });
    
  } catch (error: any) {
    console.error('Error starting campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
