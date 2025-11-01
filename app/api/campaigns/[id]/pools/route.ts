import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';

// Helper to get user (NextAuth, Supabase, or dev cookie)
async function getUser() {
  // First try NextAuth session
  const session = await getSession();
  if (session?.user?.id) {
    return { id: session.user.id } as any;
  }

  // Then try Supabase auth
  const supabase = await createServerSupabaseClient();
  let { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    // Finally try dev cookie
    const cookieStore = await cookies();
    const devUserId = cookieStore.get('dev-user-id')?.value;
    if (devUserId) {
      return { id: devUserId } as any;
    }
  }
  return user;
}

// POST /api/campaigns/[id]/pools - Save pool selection for campaign
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[POOLS] Starting pool selection save for campaign:', params.id);
    
    const user = await getUser();
    if (!user) {
      console.log('[POOLS] No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[POOLS] User ID:', user.id);

    const body = await request.json();
    const { poolIds } = body;

    console.log('[POOLS] Pool IDs received:', poolIds);

    if (!Array.isArray(poolIds) || poolIds.length === 0) {
      console.log('[POOLS] Invalid pool IDs');
      return NextResponse.json({ error: 'Pool IDs are required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    
    // Save pool_ids to campaign
    console.log('[POOLS] Updating campaign with pool_ids...');
    const { data: updateData, error: updateError } = await supabase
      .from('cold_outreach_campaigns')
      .update({ 
        pool_ids: poolIds,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select();

    if (updateError) {
      console.error('[POOLS] Error updating campaign pools:', updateError);
      return NextResponse.json({ 
        error: 'Failed to save pool selection', 
        details: updateError.message 
      }, { status: 500 });
    }

    console.log('[POOLS] Update successful:', updateData);

    return NextResponse.json({ 
      success: true,
      message: 'Pool selection saved',
      poolIds,
      updated: updateData
    });
  } catch (error: any) {
    console.error('[POOLS] Error in POST /api/campaigns/[id]/pools:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
