-- This migration verifies all tables exist and creates them if missing
-- Safe to run multiple times - uses "create table if not exists"

-- 1. Leads table (original)
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  company_domain text not null,
  company_name text,
  full_name text,
  email text not null,
  title text,
  seniority text,
  source text default 'anymailfinder',
  verified_at timestamptz not null default now(),
  neverbounce_result text,
  stripe_session_id text default 'dev-import',
  user_id uuid references auth.users(id),
  created_at timestamptz default now(),
  unique (email, company_domain)
);

create index if not exists leads_company_domain_idx on leads(company_domain);
create index if not exists leads_email_idx on leads(email);
create index if not exists leads_user_id_idx on leads(user_id);

-- 2. User profiles table
create table if not exists user_profiles (
  id uuid primary key references auth.users(id),
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Contacts table
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
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

create index if not exists contacts_user_id_idx on contacts(user_id);
create index if not exists contacts_email_idx on contacts(email);

-- 4. Email templates table
create table if not exists email_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  template_number int not null check (template_number in (1, 2, 3)),
  subject text not null,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, template_number)
);

create index if not exists email_templates_user_id_idx on email_templates(user_id);

-- 5. Journalist leads table
create table if not exists journalist_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
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

create index if not exists journalist_leads_user_id_idx on journalist_leads(user_id);
create index if not exists journalist_leads_industry_idx on journalist_leads(industry);
create index if not exists journalist_leads_deadline_idx on journalist_leads(deadline);
create index if not exists journalist_leads_active_idx on journalist_leads(is_active);

-- 6. Email campaigns table
create table if not exists email_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  journalist_lead_id uuid references journalist_leads(id) not null,
  contact_id uuid references contacts(id) not null,
  template_number int not null check (template_number in (1, 2, 3)),
  subject text not null,
  body text not null,
  status text default 'draft' check (status in ('draft', 'sent', 'failed')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz default now()
);

create index if not exists email_campaigns_user_id_idx on email_campaigns(user_id);
create index if not exists email_campaigns_lead_id_idx on email_campaigns(journalist_lead_id);
create index if not exists email_campaigns_contact_id_idx on email_campaigns(contact_id);
create index if not exists email_campaigns_status_idx on email_campaigns(status);

-- Enable RLS on all tables
alter table leads enable row level security;
alter table user_profiles enable row level security;
alter table contacts enable row level security;
alter table email_templates enable row level security;
alter table journalist_leads enable row level security;
alter table email_campaigns enable row level security;

-- RLS Policies for leads
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'leads' and policyname = 'Users can view their own leads') then
    create policy "Users can view their own leads" on leads for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'leads' and policyname = 'Users can insert their own leads') then
    create policy "Users can insert their own leads" on leads for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'leads' and policyname = 'Users can update their own leads') then
    create policy "Users can update their own leads" on leads for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'leads' and policyname = 'Users can delete their own leads') then
    create policy "Users can delete their own leads" on leads for delete using (auth.uid() = user_id);
  end if;
end $$;

-- RLS Policies for user_profiles
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'user_profiles' and policyname = 'Users can view their own profile') then
    create policy "Users can view their own profile" on user_profiles for select using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'user_profiles' and policyname = 'Users can insert their own profile') then
    create policy "Users can insert their own profile" on user_profiles for insert with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'user_profiles' and policyname = 'Users can update their own profile') then
    create policy "Users can update their own profile" on user_profiles for update using (auth.uid() = id);
  end if;
end $$;

-- RLS Policies for contacts
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'contacts' and policyname = 'Users can view their own contacts') then
    create policy "Users can view their own contacts" on contacts for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'contacts' and policyname = 'Users can insert their own contacts') then
    create policy "Users can insert their own contacts" on contacts for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'contacts' and policyname = 'Users can update their own contacts') then
    create policy "Users can update their own contacts" on contacts for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'contacts' and policyname = 'Users can delete their own contacts') then
    create policy "Users can delete their own contacts" on contacts for delete using (auth.uid() = user_id);
  end if;
end $$;

-- RLS Policies for email_templates
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'email_templates' and policyname = 'Users can view their own email templates') then
    create policy "Users can view their own email templates" on email_templates for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'email_templates' and policyname = 'Users can insert their own email templates') then
    create policy "Users can insert their own email templates" on email_templates for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'email_templates' and policyname = 'Users can update their own email templates') then
    create policy "Users can update their own email templates" on email_templates for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'email_templates' and policyname = 'Users can delete their own email templates') then
    create policy "Users can delete their own email templates" on email_templates for delete using (auth.uid() = user_id);
  end if;
end $$;

-- RLS Policies for journalist_leads
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'journalist_leads' and policyname = 'Users can view their own journalist leads') then
    create policy "Users can view their own journalist leads" on journalist_leads for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'journalist_leads' and policyname = 'Users can insert their own journalist leads') then
    create policy "Users can insert their own journalist leads" on journalist_leads for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'journalist_leads' and policyname = 'Users can update their own journalist leads') then
    create policy "Users can update their own journalist leads" on journalist_leads for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'journalist_leads' and policyname = 'Users can delete their own journalist leads') then
    create policy "Users can delete their own journalist leads" on journalist_leads for delete using (auth.uid() = user_id);
  end if;
end $$;

-- RLS Policies for email_campaigns
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'email_campaigns' and policyname = 'Users can view their own email campaigns') then
    create policy "Users can view their own email campaigns" on email_campaigns for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'email_campaigns' and policyname = 'Users can insert their own email campaigns') then
    create policy "Users can insert their own email campaigns" on email_campaigns for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'email_campaigns' and policyname = 'Users can update their own email campaigns') then
    create policy "Users can update their own email campaigns" on email_campaigns for update using (auth.uid() = user_id);
  end if;
end $$;
