-- Extra volunteer application fields: year of study, driving licence, car,
-- and the commitment checkbox. A car can only be declared with a licence.
alter table public.volunteers
  add column if not exists year_of_study text not null,
  add column if not exists has_license boolean not null,
  add column if not exists has_car boolean not null default false,
  add column if not exists commitment_agreed boolean not null,
  add constraint volunteers_year_len check (char_length(trim(year_of_study)) between 1 and 40),
  add constraint volunteers_car_needs_license check (has_license or not has_car),
  add constraint volunteers_commitment_agreed check (commitment_agreed);
