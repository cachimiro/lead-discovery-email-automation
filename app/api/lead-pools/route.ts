import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// GET /api/lead-pools - List all pools for the user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get user from Supabase auth
    let { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Fallback to NextAuth session
    if (authError || !user) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        user = { id: session.user.id } as any;
      }
    }
    
    // Fallback to dev cookie if no session
    if (!user) {
      const cookieStore = await cookies();
      const devUserId = cookieStore.get('dev-user-id')?.value;
      
      if (devUserId) {
        user = { id: devUserId } as any;
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch pools with contact counts
    const { data: pools, error } = await supabase
      .from('cold_outreach_pool_stats')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pools:', error);
      return NextResponse.json({ error: 'Failed to fetch pools' }, { status: 500 });
    }

    return NextResponse.json({ success: true, pools: pools || [] });
  } catch (error) {
    console.error('Error in GET /api/lead-pools:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/lead-pools - Create a new pool
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get user from Supabase auth
    let { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Fallback to NextAuth session
    if (authError || !user) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        user = { id: session.user.id } as any;
      }
    }
    
    // Fallback to dev cookie if no session
    if (!user) {
      const cookieStore = await cookies();
      const devUserId = cookieStore.get('dev-user-id')?.value;
      
      if (devUserId) {
        user = { id: devUserId } as any;
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Pool name is required' }, { status: 400 });
    }

    // Create pool
    const { data: pool, error } = await supabase
      .from('cold_outreach_lead_pools')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pool:', error);
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'A pool with this name already exists' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to create pool' }, { status: 500 });
    }

    return NextResponse.json({ success: true, pool });
  } catch (error) {
    console.error('Error in POST /api/lead-pools:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
