import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseAdmin();
    const body = await request.json();
    const { name, emails } = body;

    if (!name || !emails || emails.length === 0) {
      return NextResponse.json(
        { error: 'Campaign name and at least one email required' },
        { status: 400 }
      );
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('cold_outreach_email_campaigns')
      .insert({
        user_id: session.user.id,
        name,
        status: 'draft'
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    // Create email templates
    const templates = emails.map((email: any, index: number) => ({
      user_id: session.user.id,
      campaign_id: campaign.id,
      template_number: email.number,
      subject: email.subject,
      body: email.body,
      is_enabled: true,
      sender_name: 'Mark Hayward',
      sender_email: 'mark@swaypr.com'
    }));

    const { error: templatesError } = await supabase
      .from('cold_outreach_email_templates')
      .insert(templates);

    if (templatesError) throw templatesError;

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      message: 'Campaign created successfully'
    });

  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
