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

// GET /api/lead-pools/[id] - Get a specific pool
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    const { data: pool, error } = await supabase
      .from('cold_outreach_pool_stats')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, pool });
  } catch (error) {
    console.error('Error in GET /api/lead-pools/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/lead-pools/[id] - Update a pool
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    const body = await request.json();
    const { name, description, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Pool name is required' }, { status: 400 });
    }

    // Update pool
    const { data: pool, error } = await supabase
      .from('cold_outreach_lead_pools')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pool:', error);
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'A pool with this name already exists' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to update pool' }, { status: 500 });
    }

    if (!pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, pool });
  } catch (error) {
    console.error('Error in PUT /api/lead-pools/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/lead-pools/[id] - Delete a pool
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    // Delete pool (cascade will remove contact_pools entries)
    const { error } = await supabase
      .from('cold_outreach_lead_pools')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting pool:', error);
      return NextResponse.json({ error: 'Failed to delete pool' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/lead-pools/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
