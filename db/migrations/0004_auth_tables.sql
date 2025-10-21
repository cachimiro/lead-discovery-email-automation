-- Add user_id to leads table to associate with authenticated users
alter table leads add column if not exists user_id uuid references auth.users(id);
create index if not exists leads_user_id_idx on leads(user_id);

-- Email templates table
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

-- Custom contacts database
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

-- User profiles table for additional user data
create table if not exists user_profiles (
  id uuid primary key references auth.users(id),
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
