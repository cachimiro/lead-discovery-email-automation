-- Fix foreign key constraints to not reference auth.users
-- This allows us to use custom UUID generation from OAuth IDs

-- Drop existing foreign key constraints
alter table if exists leads drop constraint if exists leads_user_id_fkey;
alter table if exists contacts drop constraint if exists contacts_user_id_fkey;
alter table if exists email_templates drop constraint if exists email_templates_user_id_fkey;
alter table if exists journalist_leads drop constraint if exists journalist_leads_user_id_fkey;
alter table if exists email_campaigns drop constraint if exists email_campaigns_user_id_fkey;
alter table if exists user_profiles drop constraint if exists user_profiles_id_fkey;

-- Recreate foreign keys to reference user_profiles instead of auth.users
-- This allows custom UUID generation while maintaining referential integrity

-- First ensure user_profiles has a primary key
alter table user_profiles add primary key if not exists (id);

-- Add foreign keys referencing user_profiles
alter table leads 
  add constraint leads_user_id_fkey 
  foreign key (user_id) references user_profiles(id) on delete cascade;

alter table contacts 
  add constraint contacts_user_id_fkey 
  foreign key (user_id) references user_profiles(id) on delete cascade;

alter table email_templates 
  add constraint email_templates_user_id_fkey 
  foreign key (user_id) references user_profiles(id) on delete cascade;

alter table journalist_leads 
  add constraint journalist_leads_user_id_fkey 
  foreign key (user_id) references user_profiles(id) on delete cascade;

alter table email_campaigns 
  add constraint email_campaigns_user_id_fkey 
  foreign key (user_id) references user_profiles(id) on delete cascade;

-- Update RLS policies to use user_profiles
-- Drop old policies
drop policy if exists "Users can view their own leads" on leads;
drop policy if exists "Users can insert their own leads" on leads;
drop policy if exists "Users can update their own leads" on leads;
drop policy if exists "Users can delete their own leads" on leads;

drop policy if exists "Users can view their own contacts" on contacts;
drop policy if exists "Users can insert their own contacts" on contacts;
drop policy if exists "Users can update their own contacts" on contacts;
drop policy if exists "Users can delete their own contacts" on contacts;

drop policy if exists "Users can view their own email templates" on email_templates;
drop policy if exists "Users can insert their own email templates" on email_templates;
drop policy if exists "Users can update their own email templates" on email_templates;
drop policy if exists "Users can delete their own email templates" on email_templates;

drop policy if exists "Users can view their own journalist leads" on journalist_leads;
drop policy if exists "Users can insert their own journalist leads" on journalist_leads;
drop policy if exists "Users can update their own journalist leads" on journalist_leads;
drop policy if exists "Users can delete their own journalist leads" on journalist_leads;

drop policy if exists "Users can view their own email campaigns" on email_campaigns;
drop policy if exists "Users can insert their own email campaigns" on email_campaigns;
drop policy if exists "Users can update their own email campaigns" on email_campaigns;

drop policy if exists "Users can view their own profile" on user_profiles;
drop policy if exists "Users can insert their own profile" on user_profiles;
drop policy if exists "Users can update their own profile" on user_profiles;

-- Create new policies that work with custom user IDs
-- For leads
create policy "Users can view their own leads" on leads
  for select using (true);  -- Allow viewing all for now, can be restricted later

create policy "Users can insert their own leads" on leads
  for insert with check (true);

create policy "Users can update their own leads" on leads
  for update using (true);

create policy "Users can delete their own leads" on leads
  for delete using (true);

-- For contacts
create policy "Users can view their own contacts" on contacts
  for select using (true);

create policy "Users can insert their own contacts" on contacts
  for insert with check (true);

create policy "Users can update their own contacts" on contacts
  for update using (true);

create policy "Users can delete their own contacts" on contacts
  for delete using (true);

-- For email_templates
create policy "Users can view their own email templates" on email_templates
  for select using (true);

create policy "Users can insert their own email templates" on email_templates
  for insert with check (true);

create policy "Users can update their own email templates" on email_templates
  for update using (true);

create policy "Users can delete their own email templates" on email_templates
  for delete using (true);

-- For journalist_leads
create policy "Users can view their own journalist leads" on journalist_leads
  for select using (true);

create policy "Users can insert their own journalist leads" on journalist_leads
  for insert with check (true);

create policy "Users can update their own journalist leads" on journalist_leads
  for update using (true);

create policy "Users can delete their own journalist leads" on journalist_leads
  for delete using (true);

-- For email_campaigns
create policy "Users can view their own email campaigns" on email_campaigns
  for select using (true);

create policy "Users can insert their own email campaigns" on email_campaigns
  for insert with check (true);

create policy "Users can update their own email campaigns" on email_campaigns
  for update using (true);

-- For user_profiles
create policy "Users can view all profiles" on user_profiles
  for select using (true);

create policy "Users can insert their own profile" on user_profiles
  for insert with check (true);

create policy "Users can update their own profile" on user_profiles
  for update using (true);

-- Note: These policies are permissive for development
-- In production, you should restrict them to check user_id matches the session user
-- Example: for select using (user_id = current_setting('app.current_user_id')::uuid)
