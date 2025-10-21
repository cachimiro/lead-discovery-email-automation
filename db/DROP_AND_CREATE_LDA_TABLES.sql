-- Drop existing tables and policies if they exist
-- Run this in Supabase SQL Editor

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own leads" ON "LDAleads";
DROP POLICY IF EXISTS "Users can insert own leads" ON "LDAleads";
DROP POLICY IF EXISTS "Users can update own leads" ON "LDAleads";
DROP POLICY IF EXISTS "Service role has full access to leads" ON "LDAleads";
DROP POLICY IF EXISTS "Users can view own pending batches" ON "LDApending";

-- Drop existing tables
DROP TABLE IF EXISTS "LDAleads" CASCADE;
DROP TABLE IF EXISTS "LDApending" CASCADE;

-- Now create fresh tables

-- Table: LDApending
CREATE TABLE "LDApending" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leads jsonb NOT NULL,
  stripe_session_id text,
  created_at timestamptz DEFAULT now()
);

-- Table: LDAleads
CREATE TABLE "LDAleads" (
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

-- Create indexes
CREATE INDEX idx_ldaleads_user_id ON "LDAleads"(user_id);
CREATE INDEX idx_ldaleads_email ON "LDAleads"(email);
CREATE INDEX idx_ldaleads_company_domain ON "LDAleads"(company_domain);
CREATE INDEX idx_ldaleads_created_at ON "LDAleads"(created_at DESC);
CREATE INDEX idx_ldaleads_nb_status ON "LDAleads"(nb_status);
CREATE INDEX idx_ldaleads_source ON "LDAleads"(source);

-- Add comments
COMMENT ON TABLE "LDApending" IS 'Stores pending lead batches before payment/verification';
COMMENT ON TABLE "LDAleads" IS 'Stores verified and purchased email leads from lead discovery';

-- Success message
SELECT 'Tables created successfully!' as status;
