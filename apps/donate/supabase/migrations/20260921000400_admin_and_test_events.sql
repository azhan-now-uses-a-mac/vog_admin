-- Admin access + test events for A Vision of Good.
-- Run this AFTER 20260920000100_init.sql (which creates public.events and public.donations).
--
-- What this does:
--   1. Creates public.admin_users, the allow-list of who may manage events.
--   2. Lets logged-in admins create / edit / delete / toggle events (RLS).
--   3. Lets logged-in admins read donation submissions.
--   4. Seeds a few "(test)" events so people can try the forms right away.
--
-- The public (anon) role still cannot write to events. Only authenticated
-- users whose id is in admin_users can. Public read of events is unchanged.

-- 1. Admin allow-list -------------------------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

-- An authenticated user may check whether THEY are an admin, nothing more.
drop policy if exists "Admins can read their own admin row" on public.admin_users;
create policy "Admins can read their own admin row"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = auth.uid()
  );
$$;

-- 2. Admins can manage events ----------------------------------------------
grant insert, update, delete on public.events to authenticated;

drop policy if exists "Admins can insert events" on public.events;
create policy "Admins can insert events"
on public.events
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update events" on public.events;
create policy "Admins can update events"
on public.events
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete events" on public.events;
create policy "Admins can delete events"
on public.events
for delete
to authenticated
using (public.is_admin());

-- 3. Admins can read donation submissions ----------------------------------
grant select on public.donations to authenticated;

drop policy if exists "Admins can read donations" on public.donations;
create policy "Admins can read donations"
on public.donations
for select
to authenticated
using (public.is_admin());

-- 4. Test events ------------------------------------------------------------
-- Delete these before going live (or just toggle them inactive in the admin).
insert into public.events (
  name, slug, description,
  bank_name, account_name, account_number,
  payment_instructions, contact_name, contact_email, is_active
)
values
  (
    'Ramadan Food Drive (test)',
    'test-ramadan-food-drive',
    'TEST EVENT: Support families with food packs this Ramadan. Use this to try the donation and volunteer forms.',
    'Example Bank', 'A Vision of Good', '0000000000',
    'Include your full name as the payment reference, then upload a screenshot or PDF of the receipt.',
    'VOG Team', 'hello@avisionofgood.com', true
  ),
  (
    'Clean Water Project (test)',
    'test-water-project',
    'TEST EVENT: Help fund clean water access. Safe to submit dummy data here.',
    'Example Bank', 'A Vision of Good', '0000000000',
    'Include your full name as the payment reference.',
    'VOG Team', 'hello@avisionofgood.com', true
  ),
  (
    'Winter Relief (test)',
    'test-winter-relief',
    'TEST EVENT: Warm clothing and shelter support. This is a demo event.',
    'Example Bank', 'A Vision of Good', '0000000000',
    'Include your full name as the payment reference.',
    'VOG Team', 'hello@avisionofgood.com', true
  ),
  (
    'Orphan Sponsorship (test)',
    'test-orphan-sponsorship',
    'TEST EVENT: Monthly sponsorship demo. Inactive-event behaviour can be tested by toggling this off in the admin.',
    'Example Bank', 'A Vision of Good', '0000000000',
    'Include your full name as the payment reference.',
    'VOG Team', 'hello@avisionofgood.com', true
  )
on conflict (slug) do nothing;

-- 5. Add yourself as an admin ----------------------------------------------
-- FIRST create a user in the Supabase dashboard (Authentication -> Users -> Add user,
-- with a password). THEN run the line below with that email to grant admin rights:
--
--   insert into public.admin_users (user_id)
--   select id from auth.users where email = 'you@avisionofgood.com'
--   on conflict do nothing;
