-- Optional: let logged-in admins read volunteer submissions.
-- Run this AFTER the volunteer table migration (20260920000300_create_volunteers.sql)
-- and AFTER the donate app's 20260921000400_admin_and_test_events.sql (which creates
-- public.is_admin() and public.admin_users).

grant select on public.volunteers to authenticated;

drop policy if exists "Admins can read volunteers" on public.volunteers;
create policy "Admins can read volunteers"
on public.volunteers
for select
to authenticated
using (public.is_admin());
