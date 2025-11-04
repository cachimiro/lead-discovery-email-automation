/**
 * CHECKOUT / SAVE DISCOVERED LEADS
 * 
 * Saves discovered leads from the discover page to the database
 */

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
    const { leads } = body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: 'No leads provided' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();
    const userId = session.user.id;

    // Prepare leads for insertion
    const leadsToInsert = leads.map((lead: any) => ({
      user_id: userId,
      contact_email: lead.email,
      contact_first_name: lead.fullName?.split(' ')[0] || '',
      contact_last_name: lead.fullName?.split(' ').slice(1).join(' ') || '',
      contact_title: lead.title || '',
      company_name: lead.companyName || '',
      company_domain: lead.company_domain || '',
      email_status: lead.verified_status || lead.amf_email_status || 'unknown',
      source: lead.source || 'decision_maker',
      decision_categories: lead.decision_categories || [],
      created_at: new Date().toISOString()
    }));

    // Insert into AI discovered leads table
    const { data, error } = await supabase
      .from('cold_outreach_ai_discovered_leads')
      .insert(leadsToInsert)
      .select();

    if (error) {
      console.error('Error saving discovered leads:', error);
      
      // Check for duplicate email error
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Some leads already exist in your database' },
          { status: 400 }
        );
      }
      
      throw error;
    }

    return NextResponse.json({
      success: true,
      batchId: data?.[0]?.id || 'batch_' + Date.now(),
      savedCount: data?.length || 0,
      message: `Successfully saved ${data?.length || 0} lead${data?.length !== 1 ? 's' : ''}`
    });

  } catch (error: any) {
    console.error('Error in checkout API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
