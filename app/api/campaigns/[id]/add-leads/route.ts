import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseAdmin();
    const body = await request.json();
    const { leadIds } = body;
    const campaignId = params.id;

    if (!leadIds || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one lead required' },
        { status: 400 }
      );
    }

    // Verify campaign ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('cold_outreach_email_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', session.user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get lead details
    const { data: leads, error: leadsError } = await supabase
      .from('cold_outreach_contacts')
      .select('*')
      .in('id', leadIds)
      .eq('user_id', session.user.id);

    if (leadsError) throw leadsError;

    // Link leads to campaign (update campaign_id in contacts)
    const { error: updateError } = await supabase
      .from('cold_outreach_contacts')
      .update({ campaign_id: campaignId })
      .in('id', leadIds);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      leadsAdded: leads?.length || 0,
      message: `${leads?.length || 0} leads added to campaign`
    });

  } catch (error: any) {
    console.error('Error adding leads:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
