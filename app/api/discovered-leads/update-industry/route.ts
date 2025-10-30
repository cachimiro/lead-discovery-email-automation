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
    const { id, industry, source } = body;

    if (!id || !industry) {
      return NextResponse.json({ error: 'Lead ID and industry required' }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    
    // Update the appropriate table based on source
    const tableName = source === 'ai' 
      ? 'cold_outreach_ai_discovered_leads'
      : 'cold_outreach_discovered_leads';
    
    const { error } = await supabase
      .from(tableName)
      .update({ industry: industry.trim() })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating industry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
