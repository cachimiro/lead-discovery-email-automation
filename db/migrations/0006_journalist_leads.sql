-- Journalist leads/opportunities table
create table if not exists journalist_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  
  -- Journalist info
  journalist_name text not null,
  publication text not null,
  
  -- Opportunity details
  subject text not null,
  industry text not null,
  deadline date not null,
  
  -- Optional fields
  linkedin_category text,
  notes text,
  
  -- Status tracking
  is_active boolean default true,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists journalist_leads_user_id_idx on journalist_leads(user_id);
create index if not exists journalist_leads_industry_idx on journalist_leads(industry);
create index if not exists journalist_leads_deadline_idx on journalist_leads(deadline);
create index if not exists journalist_leads_active_idx on journalist_leads(is_active);

-- RLS policies
alter table journalist_leads enable row level security;

create policy "Users can view their own journalist leads"
  on journalist_leads for select
  using (auth.uid() = user_id);

create policy "Users can insert their own journalist leads"
  on journalist_leads for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own journalist leads"
  on journalist_leads for update
  using (auth.uid() = user_id);

create policy "Users can delete their own journalist leads"
  on journalist_leads for delete
  using (auth.uid() = user_id);

-- Email campaigns table to track what was sent
create table if not exists email_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  
  journalist_lead_id uuid references journalist_leads(id) not null,
  contact_id uuid references contacts(id) not null,
  template_number int not null check (template_number in (1, 2, 3)),
  
  -- Email content (after variable substitution)
  subject text not null,
  body text not null,
  
  -- Status
  status text default 'draft' check (status in ('draft', 'sent', 'failed')),
  sent_at timestamptz,
  error_message text,
  
  created_at timestamptz default now()
);

create index if not exists email_campaigns_user_id_idx on email_campaigns(user_id);
create index if not exists email_campaigns_lead_id_idx on email_campaigns(journalist_lead_id);
create index if not exists email_campaigns_contact_id_idx on email_campaigns(contact_id);
create index if not exists email_campaigns_status_idx on email_campaigns(status);

-- RLS policies
alter table email_campaigns enable row level security;

create policy "Users can view their own email campaigns"
  on email_campaigns for select
  using (auth.uid() = user_id);

create policy "Users can insert their own email campaigns"
  on email_campaigns for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own email campaigns"
  on email_campaigns for update
  using (auth.uid() = user_id);
