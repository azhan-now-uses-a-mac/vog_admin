-- Let logged-in admins upload/replace/remove images in the public event-assets
-- bucket (used for event QR codes). Run AFTER 20260921000400_admin_and_test_events.sql
-- (which defines public.is_admin()).
--
-- Public read of event-assets already exists from the init migration.

grant insert, update, delete on storage.objects to authenticated;

drop policy if exists "Admins can upload event assets" on storage.objects;
create policy "Admins can upload event assets"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'event-assets' and public.is_admin());

drop policy if exists "Admins can update event assets" on storage.objects;
create policy "Admins can update event assets"
on storage.objects
for update
to authenticated
using (bucket_id = 'event-assets' and public.is_admin())
with check (bucket_id = 'event-assets' and public.is_admin());

drop policy if exists "Admins can delete event assets" on storage.objects;
create policy "Admins can delete event assets"
on storage.objects
for delete
to authenticated
using (bucket_id = 'event-assets' and public.is_admin());
