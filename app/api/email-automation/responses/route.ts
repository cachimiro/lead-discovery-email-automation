/**
 * EMAIL RESPONSES API
 * 
 * Get and manage email responses with AI analysis
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Helper to get user (NextAuth or dev cookie)
async function getUser() {
  const session = await getServerSession(authOptions);
  
  if (session?.user) {
    return session.user;
  }
  
  // Fallback to dev cookie
  const cookieStore = await cookies();
  const devUserId = cookieStore.get('dev-user-id')?.value;
  if (devUserId) {
    return { id: devUserId } as any;
  }
  
  return null;
}

/**
 * GET - Fetch email responses with AI analysis
 */
export async function GET(request: Request) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaign_id');
    const sentiment = searchParams.get('sentiment');
    const category = searchParams.get('category');
    const requiresAttention = searchParams.get('requires_attention');
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = supabaseAdmin();
    let query = supabase
      .from('cold_outreach_response_dashboard')
      .select('*')
      .eq('user_id', user.id)
      .order('received_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    if (sentiment) {
      query = query.eq('ai_sentiment', sentiment);
    }

    if (category) {
      query = query.eq('ai_category', category);
    }

    const { data: responses, error } = await query;

    if (error) {
      console.error('Error fetching responses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }

    // Filter for requires attention if specified
    let filteredResponses = responses || [];
    if (requiresAttention === 'true') {
      filteredResponses = filteredResponses.filter(r => 
        r.ai_category === 'interested' ||
        r.ai_category === 'meeting_request' ||
        r.ai_suggested_action === 'reply_manually'
      );
    }

    // Get statistics
    const stats = {
      total: filteredResponses.length,
      by_sentiment: {
        positive: filteredResponses.filter(r => r.ai_sentiment === 'positive').length,
        negative: filteredResponses.filter(r => r.ai_sentiment === 'negative').length,
        neutral: filteredResponses.filter(r => r.ai_sentiment === 'neutral').length,
        question: filteredResponses.filter(r => r.ai_sentiment === 'question').length,
        out_of_office: filteredResponses.filter(r => r.ai_sentiment === 'out_of_office').length,
      },
      by_category: {
        interested: filteredResponses.filter(r => r.ai_category === 'interested').length,
        not_interested: filteredResponses.filter(r => r.ai_category === 'not_interested').length,
        needs_info: filteredResponses.filter(r => r.ai_category === 'needs_info').length,
        meeting_request: filteredResponses.filter(r => r.ai_category === 'meeting_request').length,
        unsubscribe: filteredResponses.filter(r => r.ai_category === 'unsubscribe').length,
        other: filteredResponses.filter(r => r.ai_category === 'other').length,
      },
      requires_attention: filteredResponses.filter(r => 
        r.ai_category === 'interested' ||
        r.ai_category === 'meeting_request' ||
        r.ai_suggested_action === 'reply_manually'
      ).length
    };

    return NextResponse.json({
      success: true,
      responses: filteredResponses,
      stats
    });

  } catch (error: any) {
    console.error('Error in responses API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update response status or add notes
 */
export async function PATCH(request: Request) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { responseId, processed, notes } = body;

    if (!responseId) {
      return NextResponse.json(
        { error: 'Response ID required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();
    
    const updateData: any = {};
    if (typeof processed === 'boolean') {
      updateData.processed = processed;
    }
    if (notes) {
      updateData.notes = notes;
    }

    const { data, error } = await supabase
      .from('cold_outreach_email_responses')
      .update(updateData)
      .eq('id', responseId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating response:', error);
      return NextResponse.json(
        { error: 'Failed to update response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      response: data
    });

  } catch (error: any) {
    console.error('Error in responses PATCH:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
