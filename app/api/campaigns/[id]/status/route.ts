import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

// GET /api/campaigns/[id]/status - Get current campaign status from database
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseAdmin();
    
    const { data: campaign, error } = await supabase
      .from('cold_outreach_campaigns')
      .select('id, name, status, created_at, updated_at, started_at, user_id')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      console.error('[STATUS] Error fetching campaign:', error);
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    console.log('[STATUS] Campaign status check:', {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      updated_at: campaign.updated_at,
      started_at: campaign.started_at
    });

    return NextResponse.json({ 
      success: true,
      campaign
    });
  } catch (error: any) {
    console.error('[STATUS] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
