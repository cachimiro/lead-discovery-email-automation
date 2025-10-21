-- ============================================
-- CREATE NEW TABLES FOR COLD OUTREACH PROJECT
-- ============================================
-- This creates completely new tables with cold_outreach_ prefix
-- Your existing tables will NOT be touched or modified
-- Safe to run - won't affect your live project

-- 1. User profiles for cold outreach
CREATE TABLE IF NOT EXISTS cold_outreach_user_profiles (
  id uuid primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Contacts for cold outreach
CREATE TABLE IF NOT EXISTS cold_outreach_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text not null,
  first_name text,
  last_name text,
  company text,
  title text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, email)
);

-- 3. Email templates for cold outreach
CREATE TABLE IF NOT EXISTS cold_outreach_email_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  template_number int not null check (template_number in (1, 2, 3)),
  subject text not null,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, template_number)
);

-- 4. Journalist leads for cold outreach
CREATE TABLE IF NOT EXISTS cold_outreach_journalist_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  journalist_name text not null,
  publication text not null,
  subject text not null,
  industry text not null,
  deadline date not null,
  linkedin_category text,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Email campaigns for cold outreach
CREATE TABLE IF NOT EXISTS cold_outreach_email_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  journalist_lead_id uuid references cold_outreach_journalist_leads(id) on delete cascade,
  contact_id uuid references cold_outreach_contacts(id) on delete cascade,
  template_number int not null check (template_number in (1, 2, 3)),
  subject text not null,
  body text not null,
  status text default 'draft' check (status in ('draft', 'sent', 'failed')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz default now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS cold_outreach_contacts_user_id_idx ON cold_outreach_contacts(user_id);
CREATE INDEX IF NOT EXISTS cold_outreach_contacts_email_idx ON cold_outreach_contacts(email);
CREATE INDEX IF NOT EXISTS cold_outreach_email_templates_user_id_idx ON cold_outreach_email_templates(user_id);
CREATE INDEX IF NOT EXISTS cold_outreach_journalist_leads_user_id_idx ON cold_outreach_journalist_leads(user_id);
CREATE INDEX IF NOT EXISTS cold_outreach_journalist_leads_industry_idx ON cold_outreach_journalist_leads(industry);
CREATE INDEX IF NOT EXISTS cold_outreach_journalist_leads_deadline_idx ON cold_outreach_journalist_leads(deadline);
CREATE INDEX IF NOT EXISTS cold_outreach_journalist_leads_active_idx ON cold_outreach_journalist_leads(is_active);
CREATE INDEX IF NOT EXISTS cold_outreach_email_campaigns_user_id_idx ON cold_outreach_email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS cold_outreach_email_campaigns_lead_id_idx ON cold_outreach_email_campaigns(journalist_lead_id);
CREATE INDEX IF NOT EXISTS cold_outreach_email_campaigns_contact_id_idx ON cold_outreach_email_campaigns(contact_id);
CREATE INDEX IF NOT EXISTS cold_outreach_email_campaigns_status_idx ON cold_outreach_email_campaigns(status);

-- Enable Row Level Security
ALTER TABLE cold_outreach_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_outreach_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_outreach_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_outreach_journalist_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_outreach_email_campaigns ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (for development)
CREATE POLICY "allow_all" ON cold_outreach_user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON cold_outreach_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON cold_outreach_email_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON cold_outreach_journalist_leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON cold_outreach_email_campaigns FOR ALL USING (true) WITH CHECK (true);

-- Verify tables were created
SELECT 
    '✅ SUCCESS! Cold Outreach tables created!' as status,
    COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'cold_outreach_%';

-- Show all cold outreach tables
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name LIKE 'cold_outreach_%'
ORDER BY table_name;
