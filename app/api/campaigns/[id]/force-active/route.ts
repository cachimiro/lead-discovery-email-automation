import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

// POST /api/campaigns/[id]/force-active - Force update campaign to active (for debugging)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseAdmin();
    
    console.log('[FORCE-ACTIVE] Attempting to force campaign to active:', {
      campaignId: params.id,
      userId: session.user.id
    });

    // First check if campaign exists
    const { data: existing, error: fetchError } = await supabase
      .from('cold_outreach_campaigns')
      .select('*')
      .eq('id', params.id)
      .single();

    console.log('[FORCE-ACTIVE] Existing campaign:', existing);
    console.log('[FORCE-ACTIVE] Fetch error:', fetchError);

    if (fetchError || !existing) {
      return NextResponse.json({ 
        error: 'Campaign not found',
        details: fetchError 
      }, { status: 404 });
    }

    // Check user_id match
    if (existing.user_id !== session.user.id) {
      console.log('[FORCE-ACTIVE] User ID mismatch:', {
        campaignUserId: existing.user_id,
        sessionUserId: session.user.id
      });
      return NextResponse.json({ 
        error: 'User ID mismatch',
        campaignUserId: existing.user_id,
        sessionUserId: session.user.id
      }, { status: 403 });
    }

    // Try to update (without started_at for now, in case column doesn't exist)
    const { data: updated, error: updateError } = await supabase
      .from('cold_outreach_campaigns')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select();

    console.log('[FORCE-ACTIVE] Update result:', updated);
    console.log('[FORCE-ACTIVE] Update error:', updateError);

    if (updateError) {
      return NextResponse.json({ 
        error: 'Update failed',
        details: updateError 
      }, { status: 500 });
    }

    if (!updated || updated.length === 0) {
      return NextResponse.json({ 
        error: 'No rows updated - this should not happen',
        campaignId: params.id,
        userId: session.user.id
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Campaign forced to active',
      campaign: updated[0]
    });
  } catch (error: any) {
    console.error('[FORCE-ACTIVE] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
