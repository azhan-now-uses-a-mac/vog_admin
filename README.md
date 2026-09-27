# A Vision of Good: Web Apps Monorepo

Three React + Vite sites for [A Vision of Good](https://www.avisionofgood.com), plus one API, all backed by **Neon** (project `VOG`, `restless-tooth-02951688`, region `aws-ap-southeast-1`).

| Part | Where | Purpose |
| --- | --- | --- |
| [`apps/donate`](apps/donate) | `donate.avisionofgood.com` | Lists active campaigns, shows bank / QR payment details, collects the donation and a proof-of-payment file. Does **not** process payments. |
| [`apps/volunteer`](apps/volunteer) | `volunteer.avisionofgood.com` | Lists active opportunities and collects volunteer applications. |
| [`apps/admin`](apps/admin) | `admin.avisionofgood.com` | Sign in (Neon Auth), create / edit / activate / deactivate events, upload QR images, export reports. |
| [`api`](api) | Neon Function `api` | The only thing that talks to the database and storage. All three sites call it. |

Every event appears on **both** public sites at `/<slug>`. Deactivate it in the admin and it disappears from both and stops accepting submissions.

## How it fits together

```
donate / volunteer / admin (static sites)
        │  HTTPS (admin adds a Neon Auth bearer token)
        ▼
   Neon Function "api"  (api/src/index.ts, Hono)
        ├── Postgres: events, donations, volunteers, admin_users
        ├── Bucket "images"   (private)      donor receipts
        └── Bucket "qr-codes" (public_read)  event QR codes
```

- The browser never gets database or storage credentials. Neon injects them into the function.
- Admin endpoints need a valid Neon Auth token **and** a row in `public.admin_users`.
- Receipts are private; the admin's donation report includes signed links that last 7 days.

## Layout

```
avisionofgood/
├── api/src/            # Neon Function (Hono): routes, auth, storage, validation
├── apps/
│   ├── donate/
│   ├── volunteer/
│   └── admin/
├── neon/migrations/    # SQL applied to Neon (via the Neon MCP)
├── neon.ts             # Neon config: auth, buckets, the api function
└── package.json        # npm workspaces root + API dependencies
```

`apps/donate/supabase` and `apps/volunteer/supabase` are the old Supabase setup, kept for reference only. Nothing uses them now.

## Run locally

```bash
npm install
neon env pull                                          # writes .env.local (DB, storage, auth vars)
neon dev --source ./api/src/index.ts --port 8787       # the API, against your Neon branch
npm run dev:donate                                     # http://localhost:5173
npm run dev:volunteer                                  # http://localhost:5174
npm run dev:admin                                      # http://localhost:5175
```

App env files (`apps/*/.env`, see each `.env.example`):

| Variable | Apps | Value |
| --- | --- | --- |
| `VITE_API_URL` | all | `http://localhost:8787` locally, the function URL in production |
| `VITE_NEON_AUTH_URL` | admin | Base URL from `neon neon-auth status` |
| `VITE_DONATE_URL`, `VITE_VOLUNTEER_URL` | admin (optional) | Targets for the "Open on site" links |

## Admin access

1. Open the admin, choose **New admin? Create an account**, and sign up.
2. Grant that account admin rights (run in the Neon SQL editor, or ask Claude to do it through the Neon MCP):

   ```sql
   insert into public.admin_users (user_id)
   select id from neon_auth."user" where email = 'you@avisionofgood.com'
   on conflict do nothing;
   ```

3. Reload the admin.

## Deploy

### API (Neon)

`neon deploy` applies `neon.ts` and deploys the `api` function. Get its URL with `neon functions get api`.

### Sites (Cloudflare Workers, static assets)

Each app has a `wrangler.jsonc` (`vog-donate`, `vog-volunteer`, `vog-admin`) that uploads its `dist` folder with SPA fallback, and a `.env.production` that points `VITE_API_URL` at the live API. Wrangler is installed at the repo root.

```bash
npx wrangler login          # once, opens the browser
npm run deploy:sites        # builds + deploys all three
npm run deploy:volunteer    # or one at a time
```

The first deploy prints each site's `*.workers.dev` URL. To use the real hostnames, add `avisionofgood.com` to Cloudflare, then uncomment the `routes` line in each `wrangler.jsonc` and deploy again.

### After the first deploy

- **Auth domain:** the admin sign-in must be allowed by Neon Auth: `neon neon-auth domain add https://<admin-site-origin>`. Do this for the `workers.dev` URL now and for `https://admin.avisionofgood.com` when the domain is attached.
- **CORS** in the API allows the three `*.avisionofgood.com` sites, the `vog-*.workers.dev` hostnames, and any `localhost` port. Add more origins with the function env var `EXTRA_ORIGINS` (comma-separated).

## Not done yet

- **Confirmation emails** to donors (the old Supabase Edge Function isn't ported).
- **Rate limiting** on the public submit endpoints. See `.claude/skills/neon-functions/references/production-hardening.md`.
- **Neon Auth custom SMTP.** The shared sender is fine for testing, but production needs your own.
