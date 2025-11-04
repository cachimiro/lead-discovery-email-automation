/**
 * CHECKOUT / SAVE DISCOVERED LEADS
 * 
 * Saves discovered leads from the discover page to the database
 */

import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * GET - Health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/checkout',
    method: 'POST',
    timestamp: new Date().toISOString()
  });
}

/**
 * POST - Save discovered leads
 */
export async function POST(request: Request) {
  console.log('[CHECKOUT] POST request received');
  
  try {
    const session = await getSession();
    console.log('[CHECKOUT] Session:', session ? 'Found' : 'Not found');

    if (!session || !session.user) {
      console.log('[CHECKOUT] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[CHECKOUT] Request body:', JSON.stringify(body, null, 2));
    const { leads } = body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      console.log('[CHECKOUT] No leads provided');
      return NextResponse.json(
        { error: 'No leads provided' },
        { status: 400 }
      );
    }

    console.log('[CHECKOUT] Processing', leads.length, 'leads');
    
    const supabase = supabaseAdmin();
    const userId = session.user.id;
    console.log('[CHECKOUT] User ID:', userId);

    // Prepare leads for insertion
    const leadsToInsert = leads.map((lead: any) => ({
      user_id: userId,
      contact_email: lead.email,
      contact_first_name: lead.fullName?.split(' ')[0] || '',
      contact_last_name: lead.fullName?.split(' ').slice(1).join(' ') || '',
      contact_title: lead.title || '',
      company_name: lead.companyName || 'Unknown',
      company_url: lead.company_domain ? `https://${lead.company_domain}` : null,
      industry: lead.industry || 'Unknown', // Required field
      email_status: lead.verified_status || lead.amf_email_status || 'unknown',
      fit_score: 50, // Default medium fit score
      data_completeness: 70, // Default completeness
      source: lead.source || 'decision_maker',
      decision_categories: lead.decision_categories || [],
      created_at: new Date().toISOString()
    }));

    console.log('[CHECKOUT] Inserting leads into database...');
    console.log('[CHECKOUT] Sample lead:', JSON.stringify(leadsToInsert[0], null, 2));
    
    // Insert into AI discovered leads table
    const { data, error } = await supabase
      .from('cold_outreach_ai_discovered_leads')
      .insert(leadsToInsert)
      .select();

    if (error) {
      console.error('[CHECKOUT] Database error:', error);
      console.error('[CHECKOUT] Error code:', error.code);
      console.error('[CHECKOUT] Error message:', error.message);
      console.error('[CHECKOUT] Error details:', JSON.stringify(error, null, 2));
      
      // Check for duplicate email error
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Some leads already exist in your database' },
          { status: 400 }
        );
      }
      
      // Check for NOT NULL constraint violation
      if (error.code === '23502') {
        return NextResponse.json(
          { error: `Missing required field: ${error.message}` },
          { status: 400 }
        );
      }
      
      throw error;
    }

    console.log('[CHECKOUT] Successfully saved', data?.length, 'leads');
    
    return NextResponse.json({
      success: true,
      batchId: data?.[0]?.id || 'batch_' + Date.now(),
      savedCount: data?.length || 0,
      message: `Successfully saved ${data?.length || 0} lead${data?.length !== 1 ? 's' : ''}`
    });

  } catch (error: any) {
    console.error('[CHECKOUT] Unhandled error:', error);
    console.error('[CHECKOUT] Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal server error', details: error.toString() },
      { status: 500 }
    );
  }
}
