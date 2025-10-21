-- Lead Discovery App (LDA) Tables - Simplified Version
-- Run this in Supabase SQL Editor

-- Table: LDApending
-- Stores pending lead batches before payment/verification
CREATE TABLE IF NOT EXISTS "LDApending" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leads jsonb NOT NULL,
  stripe_session_id text,
  created_at timestamptz DEFAULT now()
);

-- Table: LDAleads
-- Stores verified and purchased email leads
CREATE TABLE IF NOT EXISTS "LDAleads" (
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
  CONSTRAINT unique_email_company UNIQUE (email, company_domain)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ldaleads_user_id ON "LDAleads"(user_id);
CREATE INDEX IF NOT EXISTS idx_ldaleads_email ON "LDAleads"(email);
CREATE INDEX IF NOT EXISTS idx_ldaleads_company_domain ON "LDAleads"(company_domain);
CREATE INDEX IF NOT EXISTS idx_ldaleads_created_at ON "LDAleads"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ldaleads_nb_status ON "LDAleads"(nb_status);
CREATE INDEX IF NOT EXISTS idx_ldaleads_source ON "LDAleads"(source);

-- Comments
COMMENT ON TABLE "LDApending" IS 'Stores pending lead batches before payment/verification';
COMMENT ON TABLE "LDAleads" IS 'Stores verified and purchased email leads from lead discovery';
