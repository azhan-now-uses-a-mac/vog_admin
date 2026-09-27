-- Optional sample campaign. Edit or delete before production use.
insert into public.events (
  name,
  slug,
  description,
  bank_name,
  account_name,
  account_number,
  payment_instructions,
  contact_name,
  contact_email,
  is_active
)
values (
  'Ramadan Food Drive',
  'ramadan-food-drive',
  'Support families with food packs this Ramadan.',
  'Example Bank',
  'A Vision of Good',
  '0000000000',
  'Please include your full name as the payment reference, then upload a screenshot or PDF of the receipt.',
  'VOG Team',
  'hello@avisionofgood.com',
  true
)
on conflict (slug) do nothing;
