import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateNumber, enabled } = body;

    if (typeof templateNumber !== 'number' || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Update template enabled status
    const { data: template, error } = await supabase
      .from('cold_outreach_email_templates')
      .update({ 
        is_enabled: enabled,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.user.id)
      .eq('template_number', templateNumber)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      template,
      message: `Template ${enabled ? 'enabled' : 'disabled'} successfully`
    });

  } catch (error: any) {
    console.error('Error in toggle template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
