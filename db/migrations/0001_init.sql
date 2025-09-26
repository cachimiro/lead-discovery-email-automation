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
  created_at timestamptz default now(),
  unique (email, company_domain)
);

create index if not exists leads_company_domain_idx on leads(company_domain);
create index if not exists leads_email_idx on leads(email);
