import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseAdmin();
    const campaignId = params.id;

    // Get campaign with templates and contacts
    const { data: campaign, error: campaignError } = await supabase
      .from('cold_outreach_email_campaigns')
      .select(`
        *,
        cold_outreach_email_templates (*),
        cold_outreach_contacts (*)
      `)
      .eq('id', campaignId)
      .eq('user_id', session.user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get templates sorted by number
    const templates = (campaign.cold_outreach_email_templates || [])
      .filter((t: any) => t.is_enabled)
      .sort((a: any, b: any) => a.template_number - b.template_number);

    // Get contacts
    const contacts = campaign.cold_outreach_contacts || [];

    if (contacts.length === 0) {
      return NextResponse.json({
        error: 'No contacts in campaign'
      }, { status: 400 });
    }

    // Create previews for first 3 contacts
    const previews = contacts.slice(0, 3).map((contact: any) => ({
      lead: {
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        company: contact.company,
        title: contact.title
      },
      emails: templates.map((template: any) => ({
        number: template.template_number,
        subject: template.subject,
        body: template.body
      }))
    }));

    return NextResponse.json({
      success: true,
      campaignName: campaign.name,
      previews,
      totalContacts: contacts.length,
      totalEmails: contacts.length * templates.length
    });

  } catch (error: any) {
    console.error('Error generating preview:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
