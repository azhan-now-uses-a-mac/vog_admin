-- A Vision of Good: core schema on Neon.
-- Applied through the Neon MCP (prepare_database_migration / complete_database_migration).
--
-- The browser never connects to this database. All reads and writes go through
-- the Neon Function API, which holds DATABASE_URL server-side. So there are no
-- Supabase-style anon RLS policies here; access control lives in the API.
--
-- Storage (Neon buckets):
--   qr-codes : public_read  -> events.qr_code_path is an object key here
--   images   : private      -> donations.proof_storage_path is an object key here

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  qr_code_path text,
  bank_name text,
  account_name text,
  account_number text,
  payment_instructions text,
  contact_name text,
  contact_email text,
  contact_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint events_name_len check (char_length(trim(name)) between 2 and 160),
  constraint events_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint events_slug_len check (char_length(slug) between 2 and 80)
);

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id),
  full_name text not null,
  email text not null,
  phone text not null,
  amount numeric(12, 2) not null,
  currency text not null,
  payment_method text not null,
  proof_storage_path text not null,
  message text,
  created_at timestamptz not null default now(),
  constraint donations_amount_positive check (amount > 0 and amount <= 100000000),
  constraint donations_currency_ok check (currency ~ '^[A-Z]{3}$'),
  constraint donations_payment_method_ok check (payment_method in ('qr_code', 'bank_transfer')),
  constraint donations_email_ok check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint donations_name_len check (char_length(trim(full_name)) between 2 and 120),
  constraint donations_phone_len check (char_length(trim(phone)) between 7 and 32),
  constraint donations_message_len check (message is null or char_length(message) <= 2000),
  constraint donations_proof_path_ok check (char_length(proof_storage_path) between 10 and 500)
);

create table public.volunteers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id),
  full_name text not null,
  email text not null,
  phone text not null,
  university text not null,
  course text not null,
  area_of_residence text not null,
  message text,
  created_at timestamptz not null default now(),
  constraint volunteers_email_ok check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint volunteers_name_len check (char_length(trim(full_name)) between 2 and 120),
  constraint volunteers_phone_len check (char_length(trim(phone)) between 7 and 32),
  constraint volunteers_university_len check (char_length(trim(university)) between 2 and 160),
  constraint volunteers_course_len check (char_length(trim(course)) between 2 and 160),
  constraint volunteers_area_len check (char_length(trim(area_of_residence)) between 2 and 160),
  constraint volunteers_message_len check (message is null or char_length(message) <= 2000)
);

-- Allow-list of Neon Auth users who may use the admin.
create table public.admin_users (
  user_id uuid primary key references neon_auth."user" (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index donations_event_id_idx on public.donations (event_id);
create index donations_created_at_idx on public.donations (created_at desc);
create index volunteers_event_id_idx on public.volunteers (event_id);
create index volunteers_created_at_idx on public.volunteers (created_at desc);
create index events_active_created_idx on public.events (is_active, created_at desc);
