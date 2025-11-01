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
    const { contactId, industry } = body;

    if (!contactId || !industry) {
      return NextResponse.json(
        { error: 'Contact ID and industry are required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // Update contact industry
    const { data: contact, error: updateError } = await supabase
      .from('cold_outreach_contacts')
      .update({
        industry: industry.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contact: contact,
      message: 'Industry updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating contact industry:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
