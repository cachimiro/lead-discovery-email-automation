import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { industry } = body;

    console.log('Update industry request:', {
      contactId: params.id,
      userId: session.user.id,
      newIndustry: industry
    });

    if (!industry || industry.trim() === '') {
      return NextResponse.json({ error: 'Industry is required' }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Update contact industry
    const { data: contact, error } = await supabase
      .from('cold_outreach_contacts')
      .update({ 
        industry: industry.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating contact industry:', error);
      return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
    }

    if (!contact) {
      console.error('Contact not found after update');
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    console.log('Contact industry updated successfully:', {
      contactId: contact.id,
      newIndustry: contact.industry
    });

    return NextResponse.json({ 
      success: true, 
      contact,
      message: 'Industry updated successfully'
    });

  } catch (error: any) {
    console.error('Error in update-industry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
