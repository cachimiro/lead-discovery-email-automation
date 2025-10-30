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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseAdmin();
    const campaignId = params.id;

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('cold_outreach_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campaignError || !campaign) {
      console.error('Campaign not found:', campaignError);
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get user's email templates
    const { data: templates, error: templateError } = await supabase
      .from('cold_outreach_email_templates')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_enabled', true)
      .order('template_number', { ascending: true });

    if (templateError) {
      console.error('Error fetching templates:', templateError);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    if (!templates || templates.length === 0) {
      return NextResponse.json({ error: 'No email templates found' }, { status: 404 });
    }

    // Get all journalist leads
    const { data: journalistLeads } = await supabase
      .from('cold_outreach_journalist_leads')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Get pool IDs from query params if provided
    const url = new URL(request.url);
    const poolsParam = url.searchParams.get('pools');
    const poolIds = poolsParam ? poolsParam.split(',') : [];

    // Get user contacts/leads (filtered by pools if specified)
    let userLeads: any[] = [];
    
    if (poolIds.length > 0) {
      // Get contacts from specific pools using the function
      const { data, error } = await supabase.rpc('get_contacts_in_pools', {
        p_user_id: user.id,
        p_pool_ids: poolIds
      });
      
      if (error) {
        console.error('Error fetching contacts from pools:', error);
      } else {
        userLeads = data || [];
      }
    } else {
      // Get all contacts
      const { data } = await supabase
        .from('cold_outreach_contacts')
        .select('*')
        .eq('user_id', user.id);
      
      userLeads = data || [];
    }

    if (!journalistLeads || journalistLeads.length === 0) {
      return NextResponse.json({
        error: 'No journalist leads found. Please add journalist leads first.'
      }, { status: 400 });
    }

    if (!userLeads || userLeads.length === 0) {
      return NextResponse.json({
        error: 'No user leads found. Please add contacts to reach out to first.'
      }, { status: 400 });
    }

    // Auto-match by industry
    const matchedPairs: any[] = [];
    const contactsWithoutIndustry: any[] = [];
    const contactsWithNonMatchingIndustry: any[] = [];
    
    console.log('Starting industry matching:', {
      totalUserLeads: userLeads.length,
      totalJournalistLeads: journalistLeads.length,
      journalistIndustries: journalistLeads.map((j: any) => j.industry).filter(Boolean)
    });
    
    for (const userLead of userLeads) {
      // Skip if missing required data (email and name)
      if (!userLead.email || !userLead.first_name) {
        continue;
      }

      console.log('Processing contact:', {
        id: userLead.id,
        email: userLead.email,
        industry: userLead.industry
      });

      // Track contacts without industry
      if (!userLead.industry || userLead.industry.trim() === '') {
        console.log('Contact missing industry:', userLead.email);
        contactsWithoutIndustry.push({
          id: userLead.id,
          email: userLead.email,
          first_name: userLead.first_name,
          last_name: userLead.last_name,
          company: userLead.company
        });
        continue; // Skip for now, will be added to campaign but won't get first email
      }

      // Find journalist leads matching this user's industry
      const matchingJournalists = journalistLeads.filter((j: any) => 
        j.industry && 
        userLead.industry &&
        j.industry.toLowerCase() === userLead.industry.toLowerCase()
      );

      console.log('Matching result for', userLead.email, ':', {
        userIndustry: userLead.industry,
        matchingJournalists: matchingJournalists.length
      });

      // If no matching journalists, track it but still add to campaign
      if (matchingJournalists.length === 0) {
        contactsWithNonMatchingIndustry.push({
          id: userLead.id,
          email: userLead.email,
          first_name: userLead.first_name,
          last_name: userLead.last_name,
          company: userLead.company,
          industry: userLead.industry
        });
        // Still add to campaign, but won't get first email until industry matches
        continue;
      }

      // If we found matching journalists, create pairs
      for (const journalist of matchingJournalists) {
        matchedPairs.push({
          userLead: {
            id: userLead.id,
            first_name: userLead.first_name,
            last_name: userLead.last_name,
            email: userLead.email,
            company: userLead.company,
            industry: userLead.industry
          },
          journalist: {
            first_name: journalist.first_name,
            last_name: journalist.last_name,
            publication: journalist.publication || journalist.company,
            topic: journalist.topic || journalist.subject,
            industry: journalist.industry,
            notes: journalist.notes || journalist.additional_notes
          },
          emails: templates.map((template: any) => ({
            number: template.template_number,
            subject: template.subject,
            body: template.body
          }))
        });
      }
    }

    // Get unique industries from active journalist leads
    const availableIndustries = [...new Set(
      journalistLeads
        .filter((j: any) => j.industry && j.industry.trim() !== '')
        .map((j: any) => j.industry.trim())
    )].sort();

    // Return first 3 matched pairs for preview
    const previews = matchedPairs.slice(0, 3);

    console.log('Preview generation summary:', {
      totalUserLeads: userLeads.length,
      totalJournalistLeads: journalistLeads.length,
      matchedPairs: matchedPairs.length,
      contactsWithoutIndustry: contactsWithoutIndustry.length,
      contactsWithNonMatchingIndustry: contactsWithNonMatchingIndustry.length,
      availableIndustries: availableIndustries.length
    });

    return NextResponse.json({
      success: true,
      campaignName: campaign.name,
      previews,
      totalMatches: matchedPairs.length,
      totalEmails: matchedPairs.length * templates.length,
      availableIndustries, // Industries from active journalist leads
      warnings: {
        contactsWithoutIndustry: contactsWithoutIndustry.length > 0 ? contactsWithoutIndustry : undefined,
        contactsWithNonMatchingIndustry: contactsWithNonMatchingIndustry.length > 0 ? contactsWithNonMatchingIndustry : undefined
      },
      message: matchedPairs.length === 0 
        ? 'No contacts with matching industries found. Contacts will be added to campaign but won\'t receive first email until industries match.'
        : undefined
    });

  } catch (error: any) {
    console.error('Error generating preview:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
