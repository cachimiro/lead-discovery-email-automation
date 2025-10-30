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
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { poolIds } = body;

    if (!Array.isArray(poolIds) || poolIds.length === 0) {
      return NextResponse.json({ error: 'Pool IDs are required' }, { status: 400 });
    }

    // Store pool selection in session/temp storage
    // For now, we'll pass it via query params to preview page
    // In production, you might want to store this in a campaigns table

    return NextResponse.json({ 
      success: true,
      message: 'Pool selection saved'
    });
  } catch (error) {
    console.error('Error in POST /api/campaigns/[id]/pools:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
