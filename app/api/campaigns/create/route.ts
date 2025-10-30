import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await getSession();

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

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from('cold_outreach_campaigns')
      .insert({
        user_id: session.user.id,
        name: name,
        status: 'draft'
      })
      .select()
      .single();

    if (campaignError) {
      console.error('Error creating campaign:', campaignError);
      throw campaignError;
    }

    // Update or create email templates (templates are reusable, not campaign-specific)
    for (const email of emails.filter((e: any) => e.enabled)) {
      const { error: templateError } = await supabase
        .from('cold_outreach_email_templates')
        .upsert({
          user_id: session.user.id,
          template_number: email.number,
          subject: email.subject,
          body: email.body,
          is_enabled: true,
          sender_name: 'Mark Hayward',
          sender_email: 'mark@swaypr.com'
        }, {
          onConflict: 'user_id,template_number'
        });

      if (templateError) throw templateError;
    }

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      campaignName: campaign.name,
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
