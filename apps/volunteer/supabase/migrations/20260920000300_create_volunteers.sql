-- Run this after the donation project's events schema migration.
-- This app shares public.events; it only adds volunteer applications.

create extension if not exists pgcrypto;

create table if not exists public.volunteers (
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

create index if not exists volunteers_event_id_idx on public.volunteers (event_id);
create index if not exists volunteers_created_at_idx on public.volunteers (created_at desc);

alter table public.volunteers enable row level security;
revoke all on public.volunteers from anon, authenticated;
grant insert on public.volunteers to anon, authenticated;

drop policy if exists "Public can insert volunteers for active events" on public.volunteers;
create policy "Public can insert volunteers for active events"
on public.volunteers
for insert
to anon, authenticated
with check (
  exists (
    select 1 from public.events e
    where e.id = event_id and e.is_active = true
  )
);

-- No SELECT, UPDATE, or DELETE policy is intentionally created: anonymous users
-- can submit an application but cannot access existing applications.
