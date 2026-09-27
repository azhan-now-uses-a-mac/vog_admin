import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { cors } from 'hono/cors'
import { identify, requireAdmin, type AdminVariables } from './auth'
import { query } from './db'
import {
  PROOFS_BUCKET,
  QR_BUCKET,
  deleteObject,
  publicUrl,
  putObject,
  signedUrl,
} from './storage'
import {
  MAX_PROOF_BYTES,
  MAX_QR_BYTES,
  PROOF_TYPES,
  QR_TYPES,
  isSlug,
  isUuid,
  safeFileName,
  validateDonation,
  validateEvent,
  validateVolunteer,
} from './validation'

// --- CORS: the three sites, plus any localhost port for development ---------

const SITE_ORIGINS = new Set([
  'https://donate.avisionofgood.com',
  'https://volunteer.avisionofgood.com',
  'https://admin.avisionofgood.com',
  ...(process.env.EXTRA_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean),
])
const LOCALHOST = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
// The Cloudflare Workers default hostnames (vog-donate.<account>.workers.dev etc.),
// including preview versions (vog-donate-<hash>...).
const WORKERS_DEV = /^https:\/\/vog-(donate|volunteer|admin)[a-z0-9-]*\.[a-z0-9-]+\.workers\.dev$/

function allowedOrigin(origin: string): string | null {
  if (SITE_ORIGINS.has(origin) || LOCALHOST.test(origin) || WORKERS_DEV.test(origin)) return origin
  return null
}

// --- Shapes -----------------------------------------------------------------

type EventRow = {
  id: string
  name: string
  slug: string
  description: string | null
  volunteer_description: string | null
  qr_code_path: string | null
  bank_name: string | null
  account_name: string | null
  account_number: string | null
  payment_instructions: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  is_active: boolean
  created_at: string
}

const EVENT_COLUMNS = `id, name, slug, description, volunteer_description, qr_code_path, bank_name, account_name,
  account_number, payment_instructions, contact_name, contact_email, contact_phone,
  is_active, created_at`

const withQrUrl = (e: EventRow) => ({ ...e, qr_code_url: publicUrl(QR_BUCKET, e.qr_code_path) })

// Checks the first bytes so a renamed file can't pose as an image or PDF.
function sniff(bytes: Uint8Array): string | null {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'application/pdf'
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return 'image/webp'
  return null
}

function pgCode(error: unknown): string | undefined {
  return typeof error === 'object' && error && 'code' in error
    ? String((error as { code: unknown }).code)
    : undefined
}

// --- App --------------------------------------------------------------------

const app = new Hono<{ Variables: AdminVariables }>()

app.use(
  '*',
  cors({
    origin: (origin) => allowedOrigin(origin),
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
)

app.onError((error, c) => {
  console.error(error)
  return c.json({ error: 'server_error' }, 500)
})

app.get('/', (c) => c.json({ ok: true, service: 'vog api' }))

// --- Public: events -----------------------------------------------------------

app.get('/events', async (c) => {
  const rows = await query<Pick<EventRow, 'id' | 'name' | 'slug' | 'description' | 'volunteer_description'>>(
    `select id, name, slug, description, volunteer_description from public.events
     where is_active order by created_at desc`,
  )
  return c.json({ events: rows })
})

app.get('/events/:slug', async (c) => {
  const slug = c.req.param('slug')
  if (!isSlug(slug)) return c.json({ error: 'invalid_slug' }, 400)

  const [event] = await query<EventRow>(
    `select ${EVENT_COLUMNS} from public.events where slug = $1`,
    [slug],
  )
  if (!event) return c.json({ error: 'not_found' }, 404)
  if (!event.is_active) return c.json({ error: 'inactive' }, 410)
  return c.json({ event: withQrUrl(event) })
})

// --- Public: donation (multipart with the proof file) -----------------------

app.post(
  '/donations',
  bodyLimit({
    maxSize: MAX_PROOF_BYTES + 64 * 1024,
    onError: (c) => c.json({ error: 'too_large', message: 'The file is too large. Maximum size is 5 MB.' }, 413),
  }),
  async (c) => {
    const form = await c.req.parseBody()
    const eventId = form.eventId
    if (!isUuid(eventId)) return c.json({ error: 'invalid_event' }, 400)

    const { errors, value } = validateDonation(form)

    const proof = form.proof
    let bytes: Uint8Array | null = null
    let contentType = ''
    if (!(proof instanceof File) || proof.size === 0) {
      errors.proof = 'Proof of payment is required.'
    } else if (proof.size > MAX_PROOF_BYTES) {
      errors.proof = 'The file is too large. Maximum size is 5 MB.'
    } else {
      bytes = new Uint8Array(await proof.arrayBuffer())
      const detected = sniff(bytes)
      if (!detected || !(detected in PROOF_TYPES)) {
        errors.proof = 'Please upload a JPG, JPEG, PNG, or PDF file.'
      } else {
        contentType = detected
      }
    }

    if (Object.keys(errors).length > 0) {
      return c.json({ error: 'invalid', fields: errors }, 422)
    }

    const [event] = await query<{ id: string; is_active: boolean }>(
      'select id, is_active from public.events where id = $1',
      [eventId],
    )
    if (!event) return c.json({ error: 'not_found' }, 404)
    if (!event.is_active) return c.json({ error: 'inactive' }, 410)

    const donationId = crypto.randomUUID()
    const key = `${event.id}/${donationId}/${safeFileName((proof as File).name, PROOF_TYPES[contentType])}`
    await putObject(PROOFS_BUCKET, key, bytes!, contentType)

    try {
      await query(
        `insert into public.donations
           (id, event_id, full_name, email, phone, amount, currency, payment_method, proof_storage_path, message)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          donationId,
          event.id,
          value.fullName,
          value.email,
          value.phone,
          value.amount,
          value.currency,
          value.paymentMethod,
          key,
          value.message,
        ],
      )
    } catch (error) {
      // Don't leave an orphaned receipt behind if the row can't be saved.
      await deleteObject(PROOFS_BUCKET, key).catch(() => {})
      throw error
    }

    return c.json({ id: donationId, proof_storage_path: key }, 201)
  },
)

// --- Public: volunteer application -------------------------------------------

app.post('/volunteers', bodyLimit({ maxSize: 64 * 1024 }), async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  if (!body) return c.json({ error: 'invalid_json' }, 400)
  if (!isUuid(body.eventId)) return c.json({ error: 'invalid_event' }, 400)

  const { errors, value } = validateVolunteer(body)
  if (Object.keys(errors).length > 0) return c.json({ error: 'invalid', fields: errors }, 422)

  const [event] = await query<{ id: string; is_active: boolean }>(
    'select id, is_active from public.events where id = $1',
    [body.eventId],
  )
  if (!event) return c.json({ error: 'not_found' }, 404)
  if (!event.is_active) return c.json({ error: 'inactive' }, 410)

  const [row] = await query<{ id: string }>(
    `insert into public.volunteers
       (event_id, full_name, email, phone, university, course, area_of_residence,
        year_of_study, has_license, has_car, commitment_agreed, message)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) returning id`,
    [
      event.id,
      value.fullName,
      value.email,
      value.phone,
      value.university,
      value.course,
      value.areaOfResidence,
      value.yearOfStudy,
      value.hasLicense,
      value.hasCar,
      value.commitment,
      value.message,
    ],
  )
  return c.json({ id: row.id }, 201)
})

// --- Admin ------------------------------------------------------------------

// Tells the admin app who is signed in and whether they are allowed in.
app.get('/admin/me', async (c) => {
  const who = await identify(c.req.header('authorization'))
  if (!who) return c.json({ error: 'unauthorized' }, 401)
  return c.json({ userId: who.userId, email: who.email, isAdmin: who.isAdmin })
})

const admin = new Hono<{ Variables: AdminVariables }>()
admin.use('*', requireAdmin)

admin.get('/events', async (c) => {
  const rows = await query<EventRow>(
    `select ${EVENT_COLUMNS} from public.events order by created_at desc`,
  )
  return c.json({ events: rows.map(withQrUrl) })
})

async function saveEvent(body: Record<string, unknown>, id?: string) {
  const { errors, value } = validateEvent(body)
  if (Object.keys(errors).length > 0) return { status: 422 as const, body: { error: 'invalid', fields: errors } }

  const params = [
    value.name,
    value.slug,
    value.description,
    value.volunteer_description,
    value.qr_code_path,
    value.bank_name,
    value.account_name,
    value.account_number,
    value.payment_instructions,
    value.contact_name,
    value.contact_email,
    value.contact_phone,
    value.is_active,
  ]

  try {
    const rows = id
      ? await query<EventRow>(
          `update public.events set name=$1, slug=$2, description=$3, volunteer_description=$4,
             qr_code_path=$5, bank_name=$6, account_name=$7, account_number=$8,
             payment_instructions=$9, contact_name=$10, contact_email=$11, contact_phone=$12,
             is_active=$13
           where id = $14 returning ${EVENT_COLUMNS}`,
          [...params, id],
        )
      : await query<EventRow>(
          `insert into public.events (name, slug, description, volunteer_description,
             qr_code_path, bank_name, account_name, account_number, payment_instructions,
             contact_name, contact_email, contact_phone, is_active)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning ${EVENT_COLUMNS}`,
          params,
        )
    if (rows.length === 0) return { status: 404 as const, body: { error: 'not_found' } }
    return { status: id ? (200 as const) : (201 as const), body: { event: withQrUrl(rows[0]) } }
  } catch (error) {
    if (pgCode(error) === '23505') {
      return {
        status: 409 as const,
        body: { error: 'slug_taken', fields: { slug: 'That slug is already used by another event.' } },
      }
    }
    throw error
  }
}

admin.post('/events', async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  if (!body) return c.json({ error: 'invalid_json' }, 400)
  const result = await saveEvent(body)
  return c.json(result.body, result.status)
})

admin.put('/events/:id', async (c) => {
  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'not_found' }, 404)
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  if (!body) return c.json({ error: 'invalid_json' }, 400)
  const result = await saveEvent(body, id)
  return c.json(result.body, result.status)
})

admin.patch('/events/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ is_active?: unknown }>().catch(() => null)
  if (!isUuid(id) || typeof body?.is_active !== 'boolean') {
    return c.json({ error: 'invalid' }, 400)
  }
  const rows = await query<EventRow>(
    `update public.events set is_active = $1 where id = $2 returning ${EVENT_COLUMNS}`,
    [body.is_active, id],
  )
  if (rows.length === 0) return c.json({ error: 'not_found' }, 404)
  return c.json({ event: withQrUrl(rows[0]) })
})

admin.post(
  '/uploads/qr',
  bodyLimit({
    maxSize: MAX_QR_BYTES + 64 * 1024,
    onError: (c) => c.json({ error: 'too_large', message: 'Image is too large. Maximum size is 5 MB.' }, 413),
  }),
  async (c) => {
    const form = await c.req.parseBody()
    const file = form.file
    const folder = isSlug(form.folder) ? form.folder : 'events'
    if (!(file instanceof File) || file.size === 0) {
      return c.json({ error: 'invalid', message: 'Choose an image to upload.' }, 422)
    }
    if (file.size > MAX_QR_BYTES) {
      return c.json({ error: 'too_large', message: 'Image is too large. Maximum size is 5 MB.' }, 413)
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    // SVG has no magic bytes; accept it only when both the declared type and the text agree.
    const looksSvg = file.type === 'image/svg+xml' && new TextDecoder().decode(bytes.slice(0, 512)).includes('<svg')
    const contentType = looksSvg ? 'image/svg+xml' : sniff(bytes)
    if (!contentType || !(contentType in QR_TYPES)) {
      return c.json({ error: 'invalid', message: 'Please choose a PNG, JPG, WEBP, or SVG image.' }, 422)
    }

    // A fresh key per upload, so a replaced QR never shows a cached old image.
    const key = `${folder}/qr-${crypto.randomUUID()}.${QR_TYPES[contentType]}`
    await putObject(QR_BUCKET, key, bytes, contentType)
    return c.json({ key, url: publicUrl(QR_BUCKET, key) }, 201)
  },
)

const PROOF_LINK_SECONDS = 7 * 24 * 60 * 60 // the longest a signed link can last

admin.get('/reports/donations', async (c) => {
  const rows = await query<{
    created_at: string
    event_name: string
    event_slug: string
    full_name: string
    email: string
    phone: string
    amount: number
    currency: string
    payment_method: string
    message: string | null
    proof_storage_path: string
  }>(
    `select d.created_at, e.name as event_name, e.slug as event_slug, d.full_name, d.email,
            d.phone, d.amount, d.currency, d.payment_method, d.message, d.proof_storage_path
     from public.donations d join public.events e on e.id = d.event_id
     order by d.created_at desc`,
  )
  const withLinks = await Promise.all(
    rows.map(async (r) => ({
      ...r,
      proof_url: await signedUrl(PROOFS_BUCKET, r.proof_storage_path, PROOF_LINK_SECONDS),
    })),
  )
  return c.json({ rows: withLinks })
})

admin.get('/reports/volunteers', async (c) => {
  const rows = await query(
    `select v.created_at, e.name as event_name, e.slug as event_slug, v.full_name, v.email,
            v.phone, v.university, v.course, v.year_of_study, v.area_of_residence,
            v.has_license, v.has_car, v.commitment_agreed, v.message
     from public.volunteers v join public.events e on e.id = v.event_id
     order by v.created_at desc`,
  )
  return c.json({ rows })
})

// --- Admin: per-event submissions (shown in the admin dashboard) --------------

admin.get('/events/:id/donations', async (c) => {
  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'invalid_id' }, 400)
  const rows = await query<{
    id: string
    created_at: string
    full_name: string
    email: string
    phone: string
    amount: string
    currency: string
    payment_method: string
    message: string | null
    proof_storage_path: string
  }>(
    `select id, created_at, full_name, email, phone, amount::text as amount, currency,
            payment_method, message, proof_storage_path
     from public.donations where event_id = $1 order by created_at desc`,
    [id],
  )
  const withLinks = await Promise.all(
    rows.map(async (r) => ({
      ...r,
      proof_url: await signedUrl(PROOFS_BUCKET, r.proof_storage_path, PROOF_LINK_SECONDS),
    })),
  )
  return c.json({ rows: withLinks })
})

admin.get('/events/:id/volunteers', async (c) => {
  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'invalid_id' }, 400)
  const rows = await query(
    `select id, created_at, full_name, email, phone, university, course, year_of_study,
            area_of_residence, has_license, has_car, commitment_agreed, message
     from public.volunteers where event_id = $1 order by created_at desc`,
    [id],
  )
  return c.json({ rows })
})

app.route('/admin', admin)

export default app
