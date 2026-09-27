# A Vision of Good: Volunteer App

Standalone volunteer application form for A Vision of Good. It shares the existing Supabase `events` table with the donation project, while storing submissions in its own `volunteers` table.

Every opportunity uses the same generic application form. The event is selected only by the URL slug, such as `https://volunteer.avisionofgood.com/ramadan-food-drive`. Event-specific requirements (dates, location, volunteer count, gender requirements, and instructions) belong in the event's `description`, which is shown above the form.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Set these public frontend values in `.env`:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Never put a Supabase service-role key in this app or in a `VITE_` variable.

## Supabase setup

Use the same Supabase project as the donation app. First ensure its existing `events` table and event RLS policy are deployed, then run:

```text
supabase/migrations/20260920000300_create_volunteers.sql
```

This migration creates `public.volunteers` with `event_id` referencing `public.events`. Anonymous visitors can insert applications only for active events; RLS exposes no read, update, or delete access to volunteer submissions.

The volunteer form reads only `id`, `name`, `slug`, `description`, `is_active`, and `created_at` from `events`. Existing payment-related event columns are intentionally unused.

## Deployment

Build with `npm run build` and deploy `dist/` to any static host. `vercel.json` and `public/_redirects` handle SPA routes. Set the same `VITE_SUPABASE_*` values in the hosting provider, then rebuild.

## Structure

```text
src/
  components/  branding shell, generic form, event and success views
  pages/       home, volunteer route, not-found
  services/    event lookup and volunteer inserts
  hooks/       event loader
  lib/         Supabase client, validation, errors
  types/       event and volunteer data contracts
supabase/
  migrations/  volunteers table and RLS policy
```
