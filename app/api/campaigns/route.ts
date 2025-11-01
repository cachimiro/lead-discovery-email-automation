import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      console.log('[DELETE] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      console.log('[DELETE] No campaign ID provided');
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
    }

    console.log('[DELETE] Attempting to delete campaign:', { 
      campaignId: id, 
      userId: session.user.id 
    });

    const supabase = supabaseAdmin();
    
    // First check if campaign exists
    const { data: existing, error: fetchError } = await supabase
      .from('cold_outreach_campaigns')
      .select('id, user_id, name')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.log('[DELETE] Campaign not found:', fetchError);
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    console.log('[DELETE] Found campaign:', existing);

    if (existing.user_id !== session.user.id) {
      console.log('[DELETE] User mismatch:', { 
        campaignUserId: existing.user_id, 
        sessionUserId: session.user.id 
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete campaign and all related data
    // The campaign metadata is in cold_outreach_campaigns
    // Related data (templates, email queue, responses, logs) should cascade
    
    // First manually delete email queue entries (in case cascade isn't working)
    await supabase
      .from('cold_outreach_email_queue')
      .delete()
      .eq('campaign_id', id)
      .eq('user_id', session.user.id);

    // Delete email templates
    await supabase
      .from('cold_outreach_email_templates')
      .delete()
      .eq('campaign_id', id)
      .eq('user_id', session.user.id);

    // Delete responses
    await supabase
      .from('cold_outreach_email_responses')
      .delete()
      .eq('campaign_id', id)
      .eq('user_id', session.user.id);

    // Delete logs
    await supabase
      .from('cold_outreach_email_log')
      .delete()
      .eq('campaign_id', id)
      .eq('user_id', session.user.id);

    // Finally delete the campaign itself
    const { error: deleteError, data: deleteData } = await supabase
      .from('cold_outreach_campaigns')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select();

    if (deleteError) {
      console.error('[DELETE] Delete error:', deleteError);
      throw deleteError;
    }

    console.log('[DELETE] Successfully deleted campaign:', { 
      campaignId: id, 
      deletedData: deleteData 
    });

    return NextResponse.json({ 
      success: true, 
      deleted: deleteData 
    });
  } catch (error: any) {
    console.error('[DELETE] Error deleting campaign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
