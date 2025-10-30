import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseAdmin();
    
    // Delete all campaigns for this user
    const { error } = await supabase
      .from('cold_outreach_email_campaigns')
      .delete()
      .eq('user_id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'All campaigns deleted' });
  } catch (error: any) {
    console.error('Error deleting all campaigns:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
