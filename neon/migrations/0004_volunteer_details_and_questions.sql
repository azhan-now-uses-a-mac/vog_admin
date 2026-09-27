-- Volunteer-specific event details plus admin-defined extra questions.
-- volunteer_questions: [{ id, label, type: 'text'|'yes_no'|'choice', required, options: [] }]
-- volunteers.extra_answers: { [question id]: answer }
alter table public.events
  add column if not exists volunteer_date text,
  add column if not exists volunteer_location text,
  add column if not exists volunteer_requirements text,
  add column if not exists volunteer_spots integer,
  add column if not exists volunteer_questions jsonb not null default '[]'::jsonb,
  add constraint events_volunteer_spots_ok check (volunteer_spots is null or (volunteer_spots >= 1 and volunteer_spots <= 100000)),
  add constraint events_volunteer_questions_is_array check (jsonb_typeof(volunteer_questions) = 'array');

alter table public.volunteers
  add column if not exists extra_answers jsonb not null default '{}'::jsonb,
  add constraint volunteers_extra_answers_is_object check (jsonb_typeof(extra_answers) = 'object');
