-- Let the admin switch off optional standard questions per event.
-- volunteer_hidden_fields: subset of ["university","course","year_of_study","area_of_residence","driving"]
alter table public.events
  add column if not exists volunteer_hidden_fields jsonb not null default '[]'::jsonb,
  add constraint events_volunteer_hidden_fields_is_array check (jsonb_typeof(volunteer_hidden_fields) = 'array');

-- Hidden questions are stored as null.
alter table public.volunteers
  alter column university drop not null,
  alter column course drop not null,
  alter column year_of_study drop not null,
  alter column area_of_residence drop not null;
