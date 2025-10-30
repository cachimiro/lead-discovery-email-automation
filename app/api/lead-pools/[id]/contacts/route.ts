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

// GET /api/lead-pools/[id]/contacts - Get all contacts in a pool
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

    // Verify pool belongs to user
    const { data: pool } = await supabase
      .from('cold_outreach_lead_pools')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (!pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 });
    }

    // Get contacts in pool
    console.log('Fetching contacts for pool:', params.id, 'user:', user.id);
    
    // First check what's in the contact_pools table
    const { data: poolLinks } = await supabase
      .from('cold_outreach_contact_pools')
      .select('*')
      .eq('pool_id', params.id);
    
    console.log('Pool links:', poolLinks);
    
    // Check one of the contacts
    if (poolLinks && poolLinks.length > 0) {
      const { data: sampleContact } = await supabase
        .from('cold_outreach_contacts')
        .select('id, email, user_id')
        .eq('id', poolLinks[0].contact_id)
        .single();
      console.log('Sample contact:', sampleContact, 'Expected user_id:', user.id);
    }
    
    const { data: contacts, error } = await supabase
      .from('cold_outreach_contacts')
      .select(`
        *,
        cold_outreach_contact_pools!inner(added_at)
      `)
      .eq('cold_outreach_contact_pools.pool_id', params.id)
      .order('created_at', { ascending: false });

    console.log('Query result:', { contacts: contacts?.length || 0, error });

    if (error) {
      console.error('Error fetching pool contacts:', error);
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }

    return NextResponse.json({ success: true, contacts: contacts || [] });
  } catch (error) {
    console.error('Error in GET /api/lead-pools/[id]/contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/lead-pools/[id]/contacts - Add contacts to pool
export async function POST(
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
    const { contactIds } = body;

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'Contact IDs are required' }, { status: 400 });
    }

    // Verify pool belongs to user
    const { data: pool } = await supabase
      .from('cold_outreach_lead_pools')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (!pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 });
    }

    // Add contacts to pool using the function
    const { data, error } = await supabase.rpc('add_contacts_to_pool', {
      p_pool_id: params.id,
      p_contact_ids: contactIds
    });

    if (error) {
      console.error('Error adding contacts to pool:', error);
      return NextResponse.json({ error: 'Failed to add contacts to pool' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      added: data,
      message: `Added ${data} contact(s) to pool`
    });
  } catch (error) {
    console.error('Error in POST /api/lead-pools/[id]/contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/lead-pools/[id]/contacts - Remove contacts from pool
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

    const body = await request.json();
    const { contactIds } = body;

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'Contact IDs are required' }, { status: 400 });
    }

    // Verify pool belongs to user
    const { data: pool } = await supabase
      .from('cold_outreach_lead_pools')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (!pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 });
    }

    // Remove contacts from pool using the function
    const { data, error } = await supabase.rpc('remove_contacts_from_pool', {
      p_pool_id: params.id,
      p_contact_ids: contactIds
    });

    if (error) {
      console.error('Error removing contacts from pool:', error);
      return NextResponse.json({ error: 'Failed to remove contacts from pool' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      removed: data,
      message: `Removed ${data} contact(s) from pool`
    });
  } catch (error) {
    console.error('Error in DELETE /api/lead-pools/[id]/contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
