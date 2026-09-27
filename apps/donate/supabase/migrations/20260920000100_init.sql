-- A Vision of Good donation MVP
-- Apply in the Supabase SQL editor or via `supabase db push`.

create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  qr_code_path text,
  bank_name text,
  account_name text,
  account_number text,
  iban text,
  swift_code text,
  payment_instructions text,
  contact_name text,
  contact_email text,
  contact_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint events_name_len check (char_length(trim(name)) between 2 and 160),
  constraint events_slug_format check (
  slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint events_slug_len check (char_length(slug) between 2 and 80)
);

create table if not exists public.donations (
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
  constraint donations_currency_ok check (
    currency ~ '^[A-Z]{3}$'
  ),
  constraint donations_payment_method_ok check (
    payment_method in ('qr_code', 'bank_transfer')
  ),
  constraint donations_email_ok check (
  email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
),
  constraint donations_name_len check (char_length(trim(full_name)) between 2 and 120),
  constraint donations_phone_len check (char_length(trim(phone)) between 7 and 32),
  constraint donations_message_len check (message is null or char_length(message) <= 2000),
  constraint donations_proof_path_ok check (
    char_length(proof_storage_path) between 10 and 500
  )
);

create index if not exists donations_event_id_idx on public.donations (event_id);
create index if not exists donations_created_at_idx on public.donations (created_at desc);
create index if not exists events_slug_idx on public.events (slug);

alter table public.events enable row level security;
alter table public.donations enable row level security;

revoke all on public.events from anon, authenticated;
revoke all on public.donations from anon, authenticated;
grant select on public.events to anon, authenticated;
grant insert on public.donations to anon, authenticated;

drop policy if exists "Public can read events" on public.events;
create policy "Public can read events"
on public.events
for select
to anon, authenticated
using (true);

drop policy if exists "Public can insert donations for active events" on public.donations;
create policy "Public can insert donations for active events"
on public.donations
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.events e
    where e.id = event_id
      and e.is_active = true
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'donation-proofs',
  'donation-proofs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-assets',
  'event-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Donors can upload proof files" on storage.objects;
create policy "Donors can upload proof files"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'donation-proofs'
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and (
    lower(right(name, 4)) in ('.jpg', '.png', '.pdf')
    or lower(right(name, 5)) = '.jpeg'
  )
  and exists (
    select 1
    from public.events e
    where e.id::text = (storage.foldername(name))[1]
      and e.is_active = true
  )
);

drop policy if exists "Public can view event assets" on storage.objects;
create policy "Public can view event assets"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'event-assets');
