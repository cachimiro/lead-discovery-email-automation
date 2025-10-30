// ============================================
// AI LEAD DISCOVERY - TEMPORARILY DISABLED
// This feature is being refined and will be re-enabled later
// ============================================

/*
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let sessionId: string | null = null;
  const supabase = supabaseAdmin();
  
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { answers } = body;

    if (!answers) {
      return NextResponse.json({ error: 'Answers required' }, { status: 400 });
    }
    
    console.log('Starting AI lead discovery with answers:', answers);

    // Create search session record
    const { data: searchSession, error: sessionError } = await supabase
      .from('cold_outreach_ai_search_sessions')
      .insert({
        user_id: session.user.id,
        industry: answers.industry || null,
        company_size: answers.company_size || null,
        location: answers.location || null,
        lead_count: parseInt(answers.lead_count) || 100,
        job_titles: 'CEO, Marketing Director', // Fixed: always target these roles
        status: 'processing'
      })
      .select()
      .single();

    if (sessionError) throw sessionError;
    sessionId = searchSession.id;

    // Create batch status tracker
    await supabase.from('cold_outreach_batch_status').insert({
      search_session_id: sessionId,
      total_steps: 5,
      current_step: 0,
      step_name: 'Initializing',
      step_status: 'running'
    });

    // Step 1: Use OpenAI to research and find company URLs
    await updateBatchStatus(sessionId, 1, 'Researching companies with AI');
    const { companies, cost: researchCost } = await researchCompanies(answers, session.user.id);
    await logCost(session.user.id, sessionId, 'openai', 'llm', researchCost);
    
    // Filter out companies we already have to prevent duplicate processing
    // This saves AnyMail finder tokens and NeverBounce credits
    const existingCompanies = await getExistingCompanyNames(session.user.id);
    const newCompanies = companies.filter((company: any) => 
      !existingCompanies.includes(company.name.toLowerCase().trim())
    );
    
    const duplicatesFiltered = companies.length - newCompanies.length;
    console.log(`Found ${companies.length} companies, ${newCompanies.length} are new (filtered ${duplicatesFiltered} duplicates)`);
    
    if (newCompanies.length === 0) {
      // All companies are duplicates - update session and return
      await supabase
        .from('cold_outreach_ai_search_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          companies_found: companies.length,
          companies_filtered: duplicatesFiltered,
          emails_found: 0,
          emails_validated: 0,
          leads_created: 0
        })
        .eq('id', sessionId);
      
      await updateBatchStatus(sessionId, 5, 'Complete - all companies were duplicates', 'completed');
      
      return NextResponse.json({
        success: true,
        leadsFound: 0,
        sessionId: sessionId,
        searchCriteria: answers,
        message: 'All companies found were duplicates of existing leads'
      });
    }

    // Step 2: For each company, find emails using AnyMail (only for new companies)
    await updateBatchStatus(sessionId, 2, 'Finding CEO and Marketing Director emails');
    const { leads: leadsWithEmails, cost: emailCost } = await findEmailsForCompanies(newCompanies);
    
    if (leadsWithEmails.length === 0) {
      // No emails found - update session and return
      await supabase
        .from('cold_outreach_ai_search_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          companies_found: companies.length,
          companies_filtered: duplicatesFiltered,
          emails_found: 0,
          emails_validated: 0,
          leads_created: 0
        })
        .eq('id', sessionId);
      
      await updateBatchStatus(sessionId, 5, 'Complete - no valid emails found', 'completed');
      
      return NextResponse.json({
        success: true,
        leadsFound: 0,
        sessionId: sessionId,
        searchCriteria: answers,
        message: 'No decision maker emails found for the companies'
      });
    }
    
    if (emailCost.costCents > 0) await logCost(session.user.id, sessionId, 'anymailfinder', 'data_provider', emailCost);

    // Step 3: Validate emails with NeverBounce (AnyMail already validates, but NeverBounce provides additional verification)
    await updateBatchStatus(sessionId, 3, 'Validating email addresses with NeverBounce');
    const { leads: validatedLeads, cost: validationCost } = await validateEmails(leadsWithEmails);
    if (validationCost > 0) await logCost(session.user.id, sessionId, 'neverbounce', 'email_verification', validationCost);

    // Step 4: Classify by industry using OpenAI
    await updateBatchStatus(sessionId, 4, 'Classifying leads by industry');
    const { leads: classifiedLeads, cost: classifyCost } = await classifyLeadsByIndustry(validatedLeads);
    if (classifyCost > 0) await logCost(session.user.id, sessionId, 'openai', 'llm', classifyCost);

    // Step 5: Save to database
    await updateBatchStatus(sessionId, 5, 'Saving leads to database');
    const savedLeads = await saveAIDiscoveredLeads(session.user.id, sessionId, classifiedLeads);

    // Update session with results
    await supabase
      .from('cold_outreach_ai_search_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        companies_found: companies.length,
        companies_filtered: companies.length - newCompanies.length,
        emails_found: leadsWithEmails.length,
        emails_validated: validatedLeads.filter((l: any) => l.emailValid).length,
        leads_created: savedLeads.length
      })
      .eq('id', sessionId);

    await updateBatchStatus(sessionId, 5, 'Complete', 'completed');

    return NextResponse.json({
      success: true,
      leadsFound: savedLeads.length,
      sessionId: sessionId,
      searchCriteria: answers
    });

  } catch (error: any) {
    console.error('Error processing AI lead discovery:', error);
    
    // Update session as failed
    if (sessionId) {
      await supabase
        .from('cold_outreach_ai_search_sessions')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      await updateBatchStatus(sessionId, 0, 'Failed', 'failed', error.message);
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

async function updateBatchStatus(
  sessionId: string, 
  step: number, 
  stepName: string, 
  status: string = 'running',
  errorDetails?: string
) {
  const supabase = supabaseAdmin();
  await supabase
    .from('cold_outreach_batch_status')
    .update({
      current_step: step,
      step_name: stepName,
      step_status: status,
      error_details: errorDetails || null,
      updated_at: new Date().toISOString(),
      completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null
    })
    .eq('search_session_id', sessionId);
}

async function logCost(
  userId: string,
  sessionId: string,
  serviceName: string,
  serviceType: string,
  costData: any
) {
  const supabase = supabaseAdmin();
  
  const markupPercent = 5.0; // 5% markup
  const billableCents = Math.ceil(costData.costCents * (1 + markupPercent / 100));

  await supabase.from('cold_outreach_cost_to_bill').insert({
    user_id: userId,
    search_session_id: sessionId,
    service_name: serviceName,
    service_type: serviceType,
    api_calls: costData.apiCalls || 1,
    tokens_input: costData.tokensInput || 0,
    tokens_output: costData.tokensOutput || 0,
    cost_cents: costData.costCents,
    markup_percent: markupPercent,
    billable_cents: billableCents,
    model_name: costData.modelName || null,
    request_details: costData.details || null
  });
}

async function getExistingCompanyNames(userId: string): Promise<string[]> {
  const supabase = supabaseAdmin();
  
  // Get all existing company names from discovered leads
  const { data: existingLeads } = await supabase
    .from('cold_outreach_ai_discovered_leads')
    .select('company_name')
    .eq('user_id', userId);
  
  if (!existingLeads) return [];
  
  // Return normalized company names (lowercase, trimmed)
  return existingLeads.map(lead => lead.company_name.toLowerCase().trim());
}

async function researchCompanies(answers: Record<string, string>, userId: string) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const requestedCount = parseInt(answers.lead_count) || 20;
  
  // Create a focused prompt for finding company URLs only
  const prompt = `You are researching potential PR clients for Sway PR, a Manchester-based PR agency.

Your task: Find ${requestedCount} real companies that match the criteria below. Return ONLY their company information - we will find the decision maker contacts separately.

Search Criteria:
${Object.entries(answers).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Requirements:
- Real, verifiable companies with working websites
- Companies that would benefit from PR services
- Match the industry, location, and size criteria
- Have newsworthy potential or are in growth phases

Return ONLY a JSON array with this exact structure:
[
  {
    "name": "Company Name",
    "url": "https://company.com",
    "description": "Brief description of what they do",
    "employees": "50-100",
    "industry": "Technology"
  }
]

IMPORTANT: 
- Return ONLY the JSON array, no other text
- Ensure URLs are complete and valid (include https://)
- Focus on quality companies that match the criteria`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o', // Using GPT-4o until GPT-5 is available
      messages: [
        {
          role: 'system',
          content: 'You are a B2B lead research expert. Your job is to find real companies with valid website URLs that match specific criteria. Always return valid JSON arrays with real, verifiable companies and their website URLs. Do not make up contact information - only provide company details.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('OpenAI API Error:', errorData);
    throw new Error(errorData.error?.message || 'Failed to research companies with OpenAI');
  }

  const data = await response.json();
  const companiesText = data.choices[0]?.message?.content?.trim() || '[]';
  
  // Calculate cost (GPT-4o pricing until GPT-5 available: $2.50 per 1M input, $10.00 per 1M output)
  // Will update to GPT-5 pricing ($1.25 input, $10.00 output) when available
  const tokensInput = data.usage?.prompt_tokens || 0;
  const tokensOutput = data.usage?.completion_tokens || 0;
  const costCents = Math.ceil(
    (tokensInput / 1000000 * 2.50 * 100) + 
    (tokensOutput / 1000000 * 10.00 * 100)
  );
  
  try {
    const companies = JSON.parse(companiesText);
    console.log(`OpenAI returned ${companies.length} companies:`, companies.map((c: any) => c.name).join(', '));
    return {
      companies,
      cost: {
        costCents,
        tokensInput,
        tokensOutput,
        modelName: 'gpt-4o', // Will update to gpt-5 when available
        apiCalls: 1,
        details: { prompt: prompt.substring(0, 200) + '...' }
      }
    };
  } catch (e) {
    console.error('Failed to parse companies JSON:', companiesText);
    console.error('Raw OpenAI response:', companiesText.substring(0, 500));
    return {
      companies: [],
      cost: { costCents, tokensInput, tokensOutput, modelName: 'gpt-4o', apiCalls: 1 }
    };
  }
}

async function findEmailsForCompanies(companies: any[]) {
  const { amfFindDecisionMakerEmail } = await import('@/lib/anymailfinder');
  
  const leadsWithEmails = [];
  let totalCostCents = 0;
  let successfulCalls = 0;

  console.log(`Finding decision maker emails for ${companies.length} companies using AnyMail...`);

  for (const company of companies) {
    try {
      // Extract domain from URL
      const domain = company.url
        .replace('https://', '')
        .replace('http://', '')
        .replace('www.', '')
        .split('/')[0];

      // Try to find CEO first, then Marketing Director
      const result = await amfFindDecisionMakerEmail({
        domain: domain,
        decision_maker_category: ['ceo', 'marketing']
      });

      if (result.email && result.email_status === 'valid') {
        leadsWithEmails.push({
          ...company,
          email: result.email,
          firstName: result.person_full_name?.split(' ')[0] || 'Unknown',
          lastName: result.person_full_name?.split(' ').slice(1).join(' ') || '',
          title: result.person_job_title || 'Decision Maker',
          emailStatus: result.email_status,
          emailValid: true,
          linkedinUrl: result.person_linkedin_url
        });
        
        // AnyMail pricing: ~$0.15 per successful find
        totalCostCents += 15;
        successfulCalls++;
        console.log(`✓ Found ${result.email} (${result.person_job_title}) at ${company.name}`);
      } else {
        console.log(`✗ No valid email found for ${company.name} (${domain})`);
      }
    } catch (error: any) {
      console.error(`Error finding email for ${company.name}:`, error.message);
      // Continue with next company
    }
  }

  console.log(`AnyMail results: ${successfulCalls}/${companies.length} successful finds`);

  return {
    leads: leadsWithEmails,
    cost: { 
      costCents: totalCostCents, 
      apiCalls: companies.length,
      successfulFinds: successfulCalls
    }
  };
}

async function validateEmails(leads: any[]) {
  const { nbVerifyEmail } = await import('@/lib/neverbounce');
  
  const validatedLeads = [];
  let totalCostCents = 0;

  console.log(`Validating ${leads.length} emails with NeverBounce...`);

  for (const lead of leads) {
    try {
      const nbStatus = await nbVerifyEmail(lead.email);
      const isValid = nbStatus === 'valid';
      
      validatedLeads.push({
        ...lead,
        emailValid: isValid,
        emailStatus: nbStatus,
        nbStatus: nbStatus
      });
      
      // NeverBounce pricing: ~$0.008 per email
      totalCostCents += 0.8;
      
      console.log(`${isValid ? '✓' : '✗'} ${lead.email}: ${nbStatus}`);
    } catch (error: any) {
      console.error(`Error validating ${lead.email}:`, error.message);
      // Keep the lead but mark as unknown
      validatedLeads.push({
        ...lead,
        emailValid: false,
        emailStatus: 'unknown',
        nbStatus: 'unknown'
      });
    }
  }

  const validCount = validatedLeads.filter(l => l.emailValid).length;
  console.log(`NeverBounce results: ${validCount}/${leads.length} valid emails`);

  return {
    leads: validatedLeads,
    cost: { costCents: Math.ceil(totalCostCents), apiCalls: leads.length }
  };
}

async function classifyLeadsByIndustry(leads: any[]) {
  // Industries are already provided by the research step
  return {
    leads,
    cost: { costCents: 0, apiCalls: 0 }
  };
}

async function saveAIDiscoveredLeads(userId: string, sessionId: string, leads: any[]) {
  const supabase = supabaseAdmin();
  
  console.log(`Saving ${leads.length} AI discovered leads for user ${userId}`);
  
  const leadsToInsert = leads.map(lead => ({
    user_id: userId,
    search_session_id: sessionId,
    company_name: lead.name,
    company_url: lead.url,
    company_description: lead.description,
    industry: lead.industry,
    employee_count: lead.employees,
    contact_email: lead.email,
    contact_first_name: lead.firstName,
    contact_last_name: lead.lastName,
    contact_title: lead.title,
    email_status: lead.emailStatus,
    email_verified_at: lead.emailValid ? new Date().toISOString() : null,
    fit_score: 85, // Placeholder - would be calculated based on ICP match
    data_completeness: 75, // Placeholder - based on fields filled
    data_source: 'openai_research'
  }));

  const { data, error } = await supabase
    .from('cold_outreach_ai_discovered_leads')
    .insert(leadsToInsert)
    .select();

  if (error) {
    console.error('Error saving AI discovered leads:', error);
    throw error;
  }
  
  console.log(`Successfully saved ${data?.length || 0} leads to cold_outreach_ai_discovered_leads table`);

  return data || [];
}
*/

// Temporary disabled endpoint - returns not implemented
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json(
    { error: 'AI Lead Discovery is temporarily disabled for refinement' },
    { status: 503 }
  );
}
