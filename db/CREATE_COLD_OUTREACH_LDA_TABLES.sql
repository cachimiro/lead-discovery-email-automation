-- Cold Outreach Lead Discovery Tables
-- Prefixed with cold_outreach_ to avoid conflicts with other projects
-- Run this in Supabase SQL Editor

-- Table: cold_outreach_pending_leads
-- Stores pending lead batches before payment/verification
CREATE TABLE IF NOT EXISTS "cold_outreach_pending_leads" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leads jsonb NOT NULL,
  stripe_session_id text,
  created_at timestamptz DEFAULT now()
);

-- Table: cold_outreach_discovered_leads
-- Stores verified and purchased email leads from discovery
CREATE TABLE IF NOT EXISTS "cold_outreach_discovered_leads" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  
  -- Lead source information
  source text NOT NULL,
  decision_categories text[],
  linkedin_url text,
  email_type text,
  
  -- Company information
  company_domain text NOT NULL,
  company_name text,
  
  -- Person information
  full_name text,
  first_name text,
  last_name text,
  title text,
  seniority text,
  
  -- Email information
  email text NOT NULL,
  amf_email_status text,
  nb_status text,
  
  -- Timestamps
  discovered_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  date_created date,
  
  -- Payment tracking
  stripe_session_id text,
  
  -- Additional metadata
  meta jsonb,
  
  -- Unique constraint
  CONSTRAINT cold_outreach_unique_email_company UNIQUE (email, company_domain)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cold_outreach_discovered_leads_user_id 
  ON "cold_outreach_discovered_leads"(user_id);
CREATE INDEX IF NOT EXISTS idx_cold_outreach_discovered_leads_email 
  ON "cold_outreach_discovered_leads"(email);
CREATE INDEX IF NOT EXISTS idx_cold_outreach_discovered_leads_company_domain 
  ON "cold_outreach_discovered_leads"(company_domain);
CREATE INDEX IF NOT EXISTS idx_cold_outreach_discovered_leads_created_at 
  ON "cold_outreach_discovered_leads"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cold_outreach_discovered_leads_nb_status 
  ON "cold_outreach_discovered_leads"(nb_status);
CREATE INDEX IF NOT EXISTS idx_cold_outreach_discovered_leads_source 
  ON "cold_outreach_discovered_leads"(source);

-- Add comments
COMMENT ON TABLE "cold_outreach_pending_leads" IS 'Cold Outreach: Stores pending lead batches before payment/verification';
COMMENT ON TABLE "cold_outreach_discovered_leads" IS 'Cold Outreach: Stores verified and purchased email leads from lead discovery';

-- Success message
SELECT 'Cold Outreach tables created successfully!' as status;
