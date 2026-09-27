# A Vision of Good: Donation App

Standalone donation form for [A Vision of Good](https://www.avisionofgood.com). It replaces Google Forms for collecting donation details and proof of payment.

The same React form is reused for every campaign. The event is taken from the URL slug, never from a form field:

- `https://donate.avisionofgood.com/ramadan-food-drive`
- `https://donate.avisionofgood.com/water-project`
- `https://donate.avisionofgood.com/oman-relief`

This website does **not** process payments. It shows event-specific payment instructions and stores the donor record plus a private proof-of-payment file.

## 1. Install dependencies

```bash
npm install
```

## 2. Run locally

Copy the environment template and add your Supabase project values:

```bash
cp .env.example .env
```

Then start the Vite dev server:

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Root (`/`) explains that an event link is required. After you create an event, visit `http://localhost:5173/<event-slug>`.

## 3. Create and configure the Supabase project

1. Create a project at [https://supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` / publishable key → `VITE_SUPABASE_ANON_KEY`
3. Never put the **service role** key in this frontend or in any `VITE_` variable.

Example `.env`:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

## 4. Run the database schema

In the Supabase dashboard, open **SQL Editor** and run these files in order:

1. `supabase/migrations/20260920000100_init.sql`
2. `supabase/migrations/20260920000200_sample_event.sql` (optional sample campaign)

The first migration creates:

- `events`: campaign configuration, keyed by `slug`
- `donations`: donor submissions, with `event_id` as a foreign key
- Row Level Security so anonymous visitors can:
  - read events
  - insert donation rows for **active** events only
  - **not** read, update, or delete donations

If you use the Supabase CLI:

```bash
supabase db push
```

## 5. Configure storage buckets

The init SQL also creates two buckets:

| Bucket | Public? | Purpose |
| --- | --- | --- |
| `donation-proofs` | No | Donor receipts (JPG, JPEG, PNG, PDF, max 8 MB) |
| `event-assets` | Yes | Event QR codes and similar images |

Storage policies:

- Anonymous users may **upload** a proof file into `donation-proofs/{event-id}/{donation-id}/filename`.
- They cannot list or download other donors’ proofs.
- Event QR images in `event-assets` are publicly readable so the form can display them.

Upload QR images in **Storage → event-assets**, then save the object path on the event row (for example `ramadan-food-drive/qr.png`).

## 6. Add a new event

Do not create a new React page. Insert a row in `events`.

```sql
insert into public.events (
  name,
  slug,
  description,
  payment_instructions,
  contact_name,
  contact_email,
  contact_phone,
  is_active
)
values (
  'Oman Relief',
  'oman-relief',
  'Emergency relief for families in Oman.',
  'Please upload a screenshot of your transfer.',
  'VOG Team',
  'hello@avisionofgood.com',
  '+96800000000',
  true
);
```

The form is then available at `/:slug`, e.g. `/oman-relief`.

Set `is_active` to `false` to close a campaign without deleting it.

## 7. Add QR / payment information for an event

Update the same event row. Only fields you fill in are shown.

**Bank transfer**

```sql
update public.events
set
  bank_name = 'Bank name',
  account_name = 'A Vision of Good',
  account_number = '123456789',
  iban = null,
  swift_code = null,
  payment_instructions = 'Use your full name as the payment reference.'
where slug = 'oman-relief';
```

**QR code**

1. Upload the QR image to the `event-assets` bucket.
2. Store the path (not a database file blob):

```sql
update public.events
set qr_code_path = 'oman-relief/qr.png'
where slug = 'oman-relief';
```

You can also store a full `https://` URL in `qr_code_path` if the image is hosted elsewhere.

To add a new payment method later, extend `src/config/paymentMethods.ts` and add a small view under `src/components/payment/methods/`. The donation form does not need a new page.

## 8. Deploy the application

Build:

```bash
npm run build
```

This is a static Vite SPA. Deploy the `dist/` folder to Vercel, Netlify, Cloudflare Pages, or similar.

Set the same `VITE_SUPABASE_*` environment variables in the host, then rebuild.

SPA routing is already covered by:

- `vercel.json`
- `public/_redirects` (Netlify)

Point a domain such as `donate.avisionofgood.com` at the host.

### Optional confirmation email

The core MVP does not depend on email. After a donation row is inserted you can send a **receipt of submission** (not a payment verification) with the Edge Function:

`supabase/functions/send-donation-confirmation`

1. Deploy the function.
2. Set secrets: `RESEND_API_KEY`, `DONATION_FROM_EMAIL`.
3. Create a Database Webhook on `public.donations` INSERT that POSTs to the function.

The email copy lives in that function and can be replaced later without changing the form.

## 9. Required environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Public anon / publishable key only |
| `RESEND_API_KEY` | Edge Function (optional) | Send confirmation email |
| `DONATION_FROM_EMAIL` | Edge Function (optional) | From address |

## Architecture

```
src/
  components/   layout, form fields, payment views, upload
  pages/        HomePage, DonationPage, NotFoundPage
  services/     events, donations, storage, email seam
  config/       currencies, payment methods, upload limits, site links
  lib/          supabase client, validation
  types/
```

Adding a campaign is a database change, not a frontend change. The same layout is intended to be copied into a later volunteer app.

## Security notes

- Service role keys never ship in the client.
- Proof files stay in a private bucket.
- Donations are insert-only for the public role.
- File type and size are checked in the browser, at the bucket, and by storage policy.
- The event used on submit is the event loaded from Supabase by slug; inserts for inactive events are rejected by RLS.
