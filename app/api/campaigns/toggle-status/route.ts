import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { campaignId, status } = body;

    if (!campaignId || !status) {
      return NextResponse.json(
        { error: 'Campaign ID and status are required' },
        { status: 400 }
      );
    }

    if (!['active', 'paused'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "active" or "paused"' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // Update campaign status
    const { data: campaign, error: updateError } = await supabase
      .from('cold_outreach_campaigns')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // If pausing, update pending emails to paused status
    if (status === 'paused') {
      await supabase
        .from('cold_outreach_email_queue')
        .update({ status: 'paused' })
        .eq('campaign_id', campaignId)
        .eq('status', 'pending');
    }

    // If resuming, update paused emails back to pending
    if (status === 'active') {
      await supabase
        .from('cold_outreach_email_queue')
        .update({ status: 'pending' })
        .eq('campaign_id', campaignId)
        .eq('status', 'paused');
    }

    // Log the action
    await supabase.from('cold_outreach_email_log').insert({
      user_id: session.user.id,
      campaign_id: campaignId,
      event_type: status === 'active' ? 'resumed' : 'paused',
      message: `Campaign ${status === 'active' ? 'resumed' : 'paused'} by user`,
      metadata: {
        previous_status: status === 'active' ? 'paused' : 'active',
        new_status: status
      }
    });

    return NextResponse.json({
      success: true,
      campaign: campaign,
      message: `Campaign ${status === 'active' ? 'resumed' : 'paused'} successfully`
    });

  } catch (error: any) {
    console.error('Error toggling campaign status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
