import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseAdmin();
    
    // Fetch both manual and AI discovered leads
    const { data: manualLeads } = await supabase
      .from('cold_outreach_discovered_leads')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    const { data: aiLeads } = await supabase
      .from('cold_outreach_ai_discovered_leads')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    // Combine and normalize both lead types
    const allLeads = [
      ...(manualLeads || []).map(lead => ({
        ...lead,
        source: 'manual',
        email: lead.email,
        isValid: lead.nb_status === 'valid'
      })),
      ...(aiLeads || []).map(lead => ({
        ...lead,
        source: 'ai',
        email: lead.contact_email,
        isValid: lead.email_status === 'valid'
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ success: true, leads: allLeads });
  } catch (error: any) {
    console.error('Error fetching discovered leads:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    
    // Delete from AI discovered leads table
    const { error } = await supabase
      .from('cold_outreach_ai_discovered_leads')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting AI discovered lead:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
