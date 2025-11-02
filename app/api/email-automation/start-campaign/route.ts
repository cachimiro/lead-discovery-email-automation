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
import { cookies } from 'next/headers';

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
 * Replace template variables with user lead and journalist data
 */
function replaceVariables(text: string, userLead: any, journalist: any): string {
  return text
    // Journalist variables
    .replace(/\{\{journalist_first_name\}\}/g, journalist?.first_name || '')
    .replace(/\{\{journalist_last_name\}\}/g, journalist?.last_name || '')
    .replace(/\{\{publication\}\}/g, journalist?.publication || journalist?.company || '')
    .replace(/\{\{topic\}\}/g, journalist?.topic || journalist?.subject || '')
    .replace(/\{\{journalist_industry\}\}/g, journalist?.industry || '')
    .replace(/\{\{notes\}\}/g, journalist?.notes || journalist?.additional_notes || '')
    // User/Lead variables
    .replace(/\{\{user_first_name\}\}/g, userLead?.first_name || '')
    .replace(/\{\{user_last_name\}\}/g, userLead?.last_name || '')
    .replace(/\{\{user_email\}\}/g, userLead?.email || '')
    .replace(/\{\{user_company\}\}/g, userLead?.company || '')
    .replace(/\{\{user_industry\}\}/g, userLead?.industry || '');
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

export async function POST(request: Request) {
  try {
    const user = await getUser();
    
    if (!user) {
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
    const userId = user.id;
    
    console.log('Starting campaign:', { campaignId, userId });
    
    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('cold_outreach_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', userId)
      .single();
    
    console.log('Campaign query result:', { campaign, campaignError });
    
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
    
    // Get enabled templates (templates are global, not campaign-specific)
    const { data: templates, error: templatesError } = await supabase
      .from('cold_outreach_email_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_enabled', true)
      .order('template_number', { ascending: true});
    
    if (templatesError || !templates || templates.length === 0) {
      return NextResponse.json(
        { error: 'No enabled email templates found' },
        { status: 400 }
      );
    }
    
    const enabledTemplates = templates;
    
    // Get contacts from pools (if pool_ids specified) or all contacts
    let allContacts: any[] = [];
    
    if (campaign.pool_ids && campaign.pool_ids.length > 0) {
      // Get contacts from specified pools
      const { data: poolContacts, error: poolError } = await supabase.rpc('get_contacts_in_pools', {
        p_user_id: userId,
        p_pool_ids: campaign.pool_ids
      });
      
      if (!poolError && poolContacts) {
        allContacts = poolContacts;
      }
    } else {
      // Get all contacts
      const { data: allUserContacts } = await supabase
        .from('cold_outreach_contacts')
        .select('*')
        .eq('user_id', userId);
      
      allContacts = allUserContacts || [];
    }
    
    // Filter for valid data
    const contacts = allContacts.filter((contact: any) => 
      contact.email && 
      contact.first_name && 
      contact.last_name && 
      contact.company
    );
    
    if (contacts.length === 0) {
      return NextResponse.json(
        { error: 'No valid contacts in campaign. All contacts are missing required data.' },
        { status: 400 }
      );
    }
    
    const skippedContacts = allContacts.length - contacts.length;
    if (skippedContacts > 0) {
      console.log(`Skipping ${skippedContacts} contacts with incomplete data`);
    }
    
    // Schedule emails
    const emailsToQueue: any[] = [];
    const now = new Date();
    let currentDate = new Date();
    
    // Set to start hour
    currentDate.setHours(sendingStartHour, 0, 0, 0);
    
    // If the scheduled time is in the past, start tomorrow
    if (currentDate <= now) {
      currentDate = getNextBusinessDay(new Date(), skipWeekends);
      currentDate.setHours(sendingStartHour, 0, 0, 0);
    }
    
    console.log('[START-CAMPAIGN] Scheduling emails starting from:', currentDate.toISOString());
    
    // Get journalist leads for industry matching (first email only)
    // Only get journalists with deadlines in the future (not out of date)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const { data: journalistLeads } = await supabase
      .from('cold_outreach_journalist_leads')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('deadline', today) // Only journalists with deadline >= today
      .order('deadline', { ascending: true }); // Order by closest deadline first

    // Schedule first email for each contact
    for (const contact of contacts) {
      if (!contact.email) continue;
      
      const template = enabledTemplates.find((t: any) => t.template_number === 1);
      if (!template) continue;

      // Check industry match for FIRST EMAIL ONLY
      // If contact has no industry or no matching journalist, mark as 'on_hold'
      let emailStatus = 'pending';
      let matchedJournalist = null;
      const hasIndustry = contact.industry && contact.industry.trim() !== '';
      
      if (!hasIndustry) {
        // No industry - put on hold until industry is added
        emailStatus = 'on_hold';
        console.log(`Contact ${contact.email} has no industry - first email on hold`);
      } else if (journalistLeads && journalistLeads.length > 0) {
        // Has industry - find matching journalists (not out of date)
        // If multiple matches, pick the one with the closest deadline (already sorted)
        matchedJournalist = journalistLeads.find((j: any) => 
          j.industry && 
          contact.industry &&
          j.industry.toLowerCase() === contact.industry.toLowerCase()
        );
        
        if (!matchedJournalist) {
          // Has industry but no match - put on hold until match is found
          emailStatus = 'on_hold';
          console.log(`Contact ${contact.email} industry "${contact.industry}" has no matching journalist with valid deadline - first email on hold`);
        } else {
          console.log(`Contact ${contact.email} matched with journalist for ${matchedJournalist.publication} (deadline: ${matchedJournalist.deadline})`);
        }
      }
      
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
          subject: replaceVariables(template.subject, contact, contact),
          body: replaceVariables(template.body, contact, contact),
          scheduled_for: retrySlot.scheduledTime!.toISOString(),
          status: emailStatus, // 'pending' or 'on_hold' based on industry match
          is_follow_up: false,
          follow_up_number: 1,
          contact_id: contact.id
        });
      } else {
        emailsToQueue.push({
          user_id: userId,
          campaign_id: campaignId,
          recipient_email: contact.email,
          subject: replaceVariables(template.subject, contact, contact),
          body: replaceVariables(template.body, contact, contact),
          scheduled_for: slot.scheduledTime!.toISOString(),
          status: emailStatus, // 'pending' or 'on_hold' based on industry match
          is_follow_up: false,
          follow_up_number: 1,
          contact_id: contact.id
        });
      }
    }
    
    // Insert emails into queue
    console.log('[START-CAMPAIGN] Inserting', emailsToQueue.length, 'emails into queue');
    console.log('[START-CAMPAIGN] First email scheduled_for:', emailsToQueue[0]?.scheduled_for);
    console.log('[START-CAMPAIGN] Current time:', new Date().toISOString());
    
    const { data: queuedEmails, error: queueError } = await supabase
      .from('cold_outreach_email_queue')
      .insert(emailsToQueue)
      .select();
    
    if (queueError) {
      console.error('[START-CAMPAIGN] Error queuing emails:', queueError);
      console.error('[START-CAMPAIGN] Failed email data:', JSON.stringify(emailsToQueue[0], null, 2));
      return NextResponse.json(
        { error: 'Failed to queue emails: ' + queueError.message },
        { status: 500 }
      );
    }
    
    // Schedule follow-ups for ONLY enabled templates
    // NOTE: Follow-up emails are ALWAYS set to 'pending' regardless of industry match
    // Industry matching only applies to the FIRST email
    const followUpEmails: any[] = [];
    
    // Only create follow-ups for templates that are actually enabled
    const followUpTemplates = enabledTemplates.filter((t: any) => t.template_number > 1);
    
    for (const template of followUpTemplates) {
      for (const firstEmail of queuedEmails || []) {
        const followUpDate = calculateFollowUpDate(
          new Date(firstEmail.scheduled_for),
          followUpDelayDays * (template.template_number - 1), // Multiply delay by template number
          skipWeekends
        );
        
        followUpEmails.push({
          user_id: userId,
          campaign_id: campaignId,
          recipient_email: firstEmail.recipient_email,
          subject: template.subject,
          body: template.body,
          scheduled_for: followUpDate.toISOString(),
          status: 'pending', // Always pending - no industry check for follow-ups
          is_follow_up: true,
          follow_up_number: template.template_number,
          parent_email_id: firstEmail.id,
          contact_id: firstEmail.contact_id
        });
      }
    }
    
    if (followUpEmails.length > 0) {
      await supabase
        .from('cold_outreach_email_queue')
        .insert(followUpEmails);
    }
    
    // Update campaign status to active (without started_at for now)
    console.log('[START-CAMPAIGN] Updating campaign status to active:', {
      campaignId,
      userId,
      currentStatus: campaign.status
    });
    
    const { data: updatedCampaign, error: statusUpdateError } = await supabase
      .from('cold_outreach_campaigns')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('user_id', userId)
      .select();

    if (statusUpdateError) {
      console.error('[START-CAMPAIGN] ❌ Error updating campaign status:', statusUpdateError);
    } else if (!updatedCampaign || updatedCampaign.length === 0) {
      console.error('[START-CAMPAIGN] ⚠️ No campaign was updated! This means the campaign was not found or user_id mismatch');
      console.error('[START-CAMPAIGN] Campaign ID:', campaignId);
      console.error('[START-CAMPAIGN] User ID:', userId);
    } else {
      console.log('[START-CAMPAIGN] ✅ Campaign status updated successfully:', updatedCampaign[0]);
    }
    
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
