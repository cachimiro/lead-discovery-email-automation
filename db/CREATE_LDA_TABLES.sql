-- Lead Discovery App (LDA) Tables
-- These tables store discovered and verified email leads

-- Table: LDApending
-- Stores pending lead batches before payment/verification
CREATE TABLE IF NOT EXISTS public."LDApending" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leads jsonb NOT NULL,
  stripe_session_id text,
  created_at timestamptz DEFAULT now()
);

-- Disable RLS for now (using service role key in app)
-- ALTER TABLE public."LDApending" ENABLE ROW LEVEL SECURITY;

-- Table: LDAleads
-- Stores verified and purchased email leads
CREATE TABLE IF NOT EXISTS public."LDAleads" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  
  -- Lead source information
  source text NOT NULL, -- 'person', 'decision_maker', 'company', 'linkedin'
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
  amf_email_status text, -- AnyMailFinder status
  nb_status text, -- NeverBounce status
  
  -- Timestamps
  discovered_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  date_created date,
  
  -- Payment tracking
  stripe_session_id text,
  
  -- Additional metadata
  meta jsonb,
  
  -- Unique constraint on email + company_domain
  CONSTRAINT unique_email_company UNIQUE (email, company_domain)
);

-- Disable RLS for now (using service role key in app)
-- ALTER TABLE public."LDAleads" ENABLE ROW LEVEL SECURITY;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ldaleads_user_id ON public."LDAleads"(user_id);
CREATE INDEX IF NOT EXISTS idx_ldaleads_email ON public."LDAleads"(email);
CREATE INDEX IF NOT EXISTS idx_ldaleads_company_domain ON public."LDAleads"(company_domain);
CREATE INDEX IF NOT EXISTS idx_ldaleads_created_at ON public."LDAleads"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ldaleads_nb_status ON public."LDAleads"(nb_status);
CREATE INDEX IF NOT EXISTS idx_ldaleads_source ON public."LDAleads"(source);

-- Grant permissions
GRANT ALL ON public."LDApending" TO postgres;
GRANT ALL ON public."LDAleads" TO postgres;
GRANT ALL ON public."LDApending" TO anon;
GRANT ALL ON public."LDAleads" TO anon;
GRANT ALL ON public."LDApending" TO authenticated;
GRANT ALL ON public."LDAleads" TO authenticated;
GRANT ALL ON public."LDApending" TO service_role;
GRANT ALL ON public."LDAleads" TO service_role;

-- Comments for documentation
COMMENT ON TABLE public."LDApending" IS 'Stores pending lead batches before payment/verification';
COMMENT ON TABLE public."LDAleads" IS 'Stores verified and purchased email leads from lead discovery';
COMMENT ON COLUMN public."LDAleads".source IS 'Source of the lead: person, decision_maker, company, or linkedin';
COMMENT ON COLUMN public."LDAleads".nb_status IS 'NeverBounce verification status: valid, invalid, disposable, unknown, catchall';
COMMENT ON COLUMN public."LDAleads".amf_email_status IS 'AnyMailFinder status: valid, risky, not_found, blacklisted';
