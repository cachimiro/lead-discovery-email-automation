import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    const supabase = supabaseAdmin();

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
    }

    // Get campaign
    const { data: campaign } = await supabase
      .from('cold_outreach_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', session.user.id)
      .single();

    // Get all emails in queue for this campaign
    const { data: emails } = await supabase
      .from('cold_outreach_email_queue')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('scheduled_for', { ascending: true });

    // Get templates
    const { data: templates } = await supabase
      .from('cold_outreach_email_templates')
      .select('*')
      .eq('user_id', session.user.id)
      .order('template_number', { ascending: true });

    // Get contacts
    const { data: contacts } = await supabase
      .from('cold_outreach_contacts')
      .select('*')
      .eq('user_id', session.user.id);

    // Get journalist leads
    const { data: journalists } = await supabase
      .from('cold_outreach_journalist_leads')
      .select('*')
      .eq('user_id', session.user.id);

    return NextResponse.json({
      campaign,
      emails: emails || [],
      emailsByStatus: {
        pending: emails?.filter(e => e.status === 'pending').length || 0,
        on_hold: emails?.filter(e => e.status === 'on_hold').length || 0,
        sent: emails?.filter(e => e.status === 'sent').length || 0,
        failed: emails?.filter(e => e.status === 'failed').length || 0,
        cancelled: emails?.filter(e => e.status === 'cancelled').length || 0,
      },
      templates: templates || [],
      contacts: contacts || [],
      journalists: journalists || [],
      totalEmails: emails?.length || 0,
    });

  } catch (error: any) {
    console.error('Error in debug API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
