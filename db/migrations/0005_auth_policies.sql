-- Enable RLS on new tables
alter table email_templates enable row level security;
alter table contacts enable row level security;
alter table user_profiles enable row level security;

-- Email templates policies
create policy "Users can view their own email templates"
  on email_templates for select
  using (auth.uid() = user_id);

create policy "Users can insert their own email templates"
  on email_templates for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own email templates"
  on email_templates for update
  using (auth.uid() = user_id);

create policy "Users can delete their own email templates"
  on email_templates for delete
  using (auth.uid() = user_id);

-- Contacts policies
create policy "Users can view their own contacts"
  on contacts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own contacts"
  on contacts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own contacts"
  on contacts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own contacts"
  on contacts for delete
  using (auth.uid() = user_id);

-- User profiles policies
create policy "Users can view their own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on user_profiles for update
  using (auth.uid() = id);

-- Leads policies (update existing)
alter table leads enable row level security;

create policy "Users can view their own leads"
  on leads for select
  using (auth.uid() = user_id);

create policy "Users can insert their own leads"
  on leads for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own leads"
  on leads for update
  using (auth.uid() = user_id);

create policy "Users can delete their own leads"
  on leads for delete
  using (auth.uid() = user_id);
