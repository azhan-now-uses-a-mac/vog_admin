-- Separate copy for the volunteer site. `description` stays the donation copy.
-- When null, the volunteer site falls back to `description`.
alter table public.events add column if not exists volunteer_description text;
