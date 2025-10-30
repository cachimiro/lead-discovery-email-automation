-- ============================================
-- AI LEAD DISCOVERY & COST TRACKING TABLES
-- ============================================

-- 1. AI Search Sessions - Track each voice search session
CREATE TABLE IF NOT EXISTS cold_outreach_ai_search_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  
  -- Search criteria (ICP)
  industry text,
  company_types text,
  company_size text,
  revenue_range text,
  location text,
  scope text, -- local, national, international
  job_titles text,
  lead_count integer,
  keywords text,
  goal text,
  
  -- Search metadata
  status text default 'processing' check (status in ('processing', 'completed', 'failed')),
  started_at timestamptz default now(),
  completed_at timestamptz,
  error_message text,
  
  -- Results
  companies_found integer default 0,
  emails_found integer default 0,
  emails_validated integer default 0,
  leads_created integer default 0,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. AI Discovered Leads - Separate from manual leads
CREATE TABLE IF NOT EXISTS cold_outreach_ai_discovered_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  search_session_id uuid references cold_outreach_ai_search_sessions(id) on delete cascade,
  
  -- Company info
  company_name text not null,
  company_url text,
  company_description text,
  industry text not null,
  employee_count text,
  revenue_estimate text,
  location text,
  
  -- Contact info
  contact_email text,
  contact_first_name text,
  contact_last_name text,
  contact_title text,
  contact_phone text,
  linkedin_url text,
  
  -- Validation
  email_status text, -- valid, invalid, accept-all, unknown
  email_verified_at timestamptz,
  
  -- Scoring
  fit_score integer, -- 0-100 based on ICP match
  data_completeness integer, -- 0-100 based on fields filled
  
  -- Metadata
  data_source text, -- apollo, clearbit, serp, etc.
  discovered_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Cost Tracking - Track all API costs for billing
CREATE TABLE IF NOT EXISTS cold_outreach_cost_to_bill (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  search_session_id uuid references cold_outreach_ai_search_sessions(id) on delete set null,
  
  -- Cost breakdown
  service_name text not null, -- openai, apollo, neverbounce, serp, etc.
  service_type text not null, -- llm, data_provider, email_verification, search
  
  -- API usage
  api_calls integer default 0,
  tokens_input integer default 0,
  tokens_output integer default 0,
  
  -- Costs (in USD cents to avoid floating point issues)
  cost_cents integer not null, -- actual cost from provider
  markup_percent decimal(5,2) default 5.00, -- default 5% markup
  billable_cents integer not null, -- cost_cents * (1 + markup_percent/100)
  
  -- Details
  model_name text, -- gpt-4o, gpt-4o-mini, etc.
  request_details jsonb, -- store full request/response metadata
  
  -- Timestamps
  incurred_at timestamptz default now(),
  billed_at timestamptz,
  created_at timestamptz default now()
);

-- 4. ICP Presets - Store successful search patterns
CREATE TABLE IF NOT EXISTS cold_outreach_icp_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  
  -- Preset info
  preset_name text not null,
  description text,
  
  -- ICP criteria (same as search session)
  industry text,
  company_types text,
  company_size text,
  revenue_range text,
  location text,
  scope text,
  job_titles text,
  keywords text,
  exclusions text,
  
  -- Performance tracking
  times_used integer default 0,
  avg_fit_score decimal(5,2),
  avg_leads_found integer,
  
  -- Metadata
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique (user_id, preset_name)
);

-- 5. Lead Feedback - Track user feedback on lead quality
CREATE TABLE IF NOT EXISTS cold_outreach_lead_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lead_id uuid references cold_outreach_ai_discovered_leads(id) on delete cascade,
  search_session_id uuid references cold_outreach_ai_search_sessions(id) on delete cascade,
  
  -- Feedback
  rating text check (rating in ('thumbs_up', 'thumbs_down', 'neutral')),
  feedback_notes text,
  
  -- What was wrong/right
  accuracy_score integer, -- 1-5
  relevance_score integer, -- 1-5
  data_quality_score integer, -- 1-5
  
  created_at timestamptz default now()
);

-- 6. Batch Processing Status - Track long-running searches
CREATE TABLE IF NOT EXISTS cold_outreach_batch_status (
  id uuid primary key default gen_random_uuid(),
  search_session_id uuid references cold_outreach_ai_search_sessions(id) on delete cascade,
  
  -- Progress tracking
  total_steps integer not null,
  current_step integer default 0,
  step_name text,
  step_status text check (step_status in ('pending', 'running', 'completed', 'failed')),
  
  -- Logs
  log_messages jsonb default '[]'::jsonb,
  error_details text,
  
  -- Timestamps
  started_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS ai_search_sessions_user_id_idx ON cold_outreach_ai_search_sessions(user_id);
CREATE INDEX IF NOT EXISTS ai_search_sessions_status_idx ON cold_outreach_ai_search_sessions(status);
CREATE INDEX IF NOT EXISTS ai_search_sessions_created_at_idx ON cold_outreach_ai_search_sessions(created_at);

CREATE INDEX IF NOT EXISTS ai_discovered_leads_user_id_idx ON cold_outreach_ai_discovered_leads(user_id);
CREATE INDEX IF NOT EXISTS ai_discovered_leads_session_id_idx ON cold_outreach_ai_discovered_leads(search_session_id);
CREATE INDEX IF NOT EXISTS ai_discovered_leads_industry_idx ON cold_outreach_ai_discovered_leads(industry);
CREATE INDEX IF NOT EXISTS ai_discovered_leads_email_status_idx ON cold_outreach_ai_discovered_leads(email_status);

CREATE INDEX IF NOT EXISTS cost_to_bill_user_id_idx ON cold_outreach_cost_to_bill(user_id);
CREATE INDEX IF NOT EXISTS cost_to_bill_session_id_idx ON cold_outreach_cost_to_bill(search_session_id);
CREATE INDEX IF NOT EXISTS cost_to_bill_service_idx ON cold_outreach_cost_to_bill(service_name);
CREATE INDEX IF NOT EXISTS cost_to_bill_incurred_at_idx ON cold_outreach_cost_to_bill(incurred_at);

CREATE INDEX IF NOT EXISTS icp_presets_user_id_idx ON cold_outreach_icp_presets(user_id);
CREATE INDEX IF NOT EXISTS icp_presets_active_idx ON cold_outreach_icp_presets(is_active);

CREATE INDEX IF NOT EXISTS lead_feedback_user_id_idx ON cold_outreach_lead_feedback(user_id);
CREATE INDEX IF NOT EXISTS lead_feedback_lead_id_idx ON cold_outreach_lead_feedback(lead_id);

CREATE INDEX IF NOT EXISTS batch_status_session_id_idx ON cold_outreach_batch_status(search_session_id);

-- Enable Row Level Security
ALTER TABLE cold_outreach_ai_search_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_outreach_ai_discovered_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_outreach_cost_to_bill ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_outreach_icp_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_outreach_lead_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_outreach_batch_status ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, can be restricted later)
CREATE POLICY "allow_all" ON cold_outreach_ai_search_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON cold_outreach_ai_discovered_leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON cold_outreach_cost_to_bill FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON cold_outreach_icp_presets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON cold_outreach_lead_feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON cold_outreach_batch_status FOR ALL USING (true) WITH CHECK (true);
