import { useRef, useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { TextArea } from '@/components/ui/TextArea'
import { isValidEmail, isValidSlug, slugify } from '@/lib/validation'
import { uploadEventImage } from '@/services/storageService'
import { StandardQuestions } from '@/components/admin/StandardQuestions'
import { VolunteerQuestionsEditor } from '@/components/admin/VolunteerQuestionsEditor'
import type { AdminEvent, EventFormValues } from '@/types/event'

const EMPTY: EventFormValues = {
  name: '',
  slug: '',
  description: '',
  volunteer_description: '',
  volunteer_date: '',
  volunteer_location: '',
  volunteer_requirements: '',
  volunteer_spots: '',
  volunteer_questions: [],
  volunteer_hidden_fields: [],
  bank_name: '',
  account_name: '',
  account_number: '',
  payment_instructions: '',
  qr_code_path: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  is_active: true,
}

function fromEvent(event: AdminEvent): EventFormValues {
  return {
    name: event.name,
    slug: event.slug,
    description: event.description ?? '',
    volunteer_description: event.volunteer_description ?? '',
    volunteer_date: event.volunteer_date ?? '',
    volunteer_location: event.volunteer_location ?? '',
    volunteer_requirements: event.volunteer_requirements ?? '',
    volunteer_spots: event.volunteer_spots ? String(event.volunteer_spots) : '',
    volunteer_questions: event.volunteer_questions ?? [],
    volunteer_hidden_fields: event.volunteer_hidden_fields ?? [],
    bank_name: event.bank_name ?? '',
    account_name: event.account_name ?? '',
    account_number: event.account_number ?? '',
    payment_instructions: event.payment_instructions ?? '',
    qr_code_path: event.qr_code_path ?? '',
    contact_name: event.contact_name ?? '',
    contact_email: event.contact_email ?? '',
    contact_phone: event.contact_phone ?? '',
    is_active: event.is_active,
  }
}

export type EventFormSection = 'event' | 'volunteer'

interface EventFormProps {
  event?: AdminEvent | null
  // 'event' edits the shared details and donation copy; 'volunteer' edits only
  // what the volunteer site shows. New events always use 'event' and show both.
  section?: EventFormSection
  onSubmit: (values: EventFormValues) => Promise<void>
  onCancel: () => void
}

export function EventForm({
  event,
  section = 'event',
  onSubmit,
  onCancel,
}: EventFormProps) {
  const isEdit = Boolean(event)
  const volunteerOnly = isEdit && section === 'volunteer'
  const showVolunteer = !isEdit || section === 'volunteer'
  const [values, setValues] = useState<EventFormValues>(
    event ? fromEvent(event) : EMPTY,
  )
  const [slugEdited, setSlugEdited] = useState(isEdit)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(
    event?.qr_code_url ?? null,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleNameChange(name: string) {
    setValues((prev) => ({
      ...prev,
      name,
      slug: slugEdited ? prev.slug : slugify(name),
    }))
  }

  async function handleImageChange(file: File | undefined) {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const folder = values.slug.trim() || slugify(values.name) || 'events'
      const uploaded = await uploadEventImage(folder, file)
      set('qr_code_path', uploaded.key)
      setQrPreviewUrl(uploaded.url)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not upload the image.',
      )
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (values.name.trim().length < 2) {
      setError('Name must be at least 2 characters.')
      return
    }
    if (!isValidSlug(values.slug.trim())) {
      setError(
        'Slug must be lowercase letters, numbers, and single hyphens (e.g. ramadan-food-drive).',
      )
      return
    }
    if (values.contact_email.trim() && !isValidEmail(values.contact_email)) {
      setError('Contact email is not valid.')
      return
    }
    const badQuestion = values.volunteer_questions.findIndex(
      (q) => !q.label.trim() || (q.type === 'choice' && q.options.length < 2),
    )
    if (badQuestion !== -1) {
      setError(`Extra question ${badQuestion + 1} needs a label${values.volunteer_questions[badQuestion].type === 'choice' ? ' and at least two options' : ''}.`)
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        ...values,
        volunteer_questions: values.volunteer_questions.map((q) => ({ ...q, label: q.label.trim() })),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the event.')
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-vog-brown/10 bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-xl font-semibold text-vog-brown">
        {volunteerOnly
          ? 'Edit volunteer details'
          : isEdit
            ? 'Edit donation & event details'
            : 'New event'}
      </h2>
      <p className="mt-1 text-sm text-vog-brown/70">
        {volunteerOnly ? (
          <>
            <span className="font-medium">{values.name}</span> · shown at{' '}
            <span className="font-mono">/{values.slug}</span> on the volunteer
            site.
          </>
        ) : (
          <>
            The event lives at{' '}
            <span className="font-mono">/{values.slug || 'your-slug'}</span> on
            both sites. {isEdit ? '' : 'Fill in the donation details first, then the volunteer details below.'}
          </>
        )}
      </p>

      {error ? (
        <div className="mt-4">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      {volunteerOnly ? null : (
        <div className="mt-5 space-y-4">
          {!isEdit ? (
            <h3 className="text-base font-semibold text-vog-brown">1. Donation details</h3>
          ) : null}
          <TextField
            id="name"
            label="Event name"
            required
            value={values.name}
            onChange={(e) => handleNameChange(e.target.value)}
          />
          <TextField
            id="slug"
            label="Slug (URL)"
            required
            value={values.slug}
            hint="Lowercase, hyphen-separated. Used in the link people open."
            onChange={(e) => {
              setSlugEdited(true)
              set('slug', e.target.value)
            }}
          />
          <TextArea
            id="description"
            label="Donation description"
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Shown above the donation form. Include dates, location, and how the money is used."
          />
        </div>
      )}

      {showVolunteer ? (
        <fieldset className="mt-6 space-y-4 rounded-2xl border border-vog-green/40 bg-vog-cream/30 p-4">
          <legend className="px-1 text-sm font-semibold text-vog-brown">
            {isEdit ? 'Volunteer site' : '2. Volunteer details'}
          </legend>
          <p className="text-xs text-vog-brown/60">
            Everything here is shown only on the volunteer site and its application form.
          </p>
          <TextArea
            id="volunteer_description"
            label="Volunteer description"
            value={values.volunteer_description}
            onChange={(e) => set('volunteer_description', e.target.value)}
            hint="Leave blank to reuse the donation description on the volunteer site."
            placeholder="What volunteers will be doing and why it matters."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="volunteer_date"
              label="Date & time"
              value={values.volunteer_date}
              onChange={(e) => set('volunteer_date', e.target.value)}
              placeholder="e.g. Sat 14 Nov, 9:00 AM – 1:00 PM"
            />
            <TextField
              id="volunteer_spots"
              label="Volunteers needed"
              type="number"
              min={1}
              value={values.volunteer_spots}
              onChange={(e) => set('volunteer_spots', e.target.value)}
              placeholder="e.g. 20"
            />
          </div>
          <TextField
            id="volunteer_location"
            label="Location / meeting point"
            value={values.volunteer_location}
            onChange={(e) => set('volunteer_location', e.target.value)}
            placeholder="e.g. Rumah Kasih Harmoni, Kuala Lumpur — meet at the main gate"
          />
          <TextArea
            id="volunteer_requirements"
            label="Requirements & what to bring"
            value={values.volunteer_requirements}
            onChange={(e) => set('volunteer_requirements', e.target.value)}
            placeholder={'One per line, e.g.\nModest clothing\nBring your own water bottle\nMust be 18+'}
          />
          <StandardQuestions
            hidden={values.volunteer_hidden_fields}
            onChange={(hidden) => set('volunteer_hidden_fields', hidden)}
          />
          <VolunteerQuestionsEditor
            questions={values.volunteer_questions}
            onChange={(questions) => set('volunteer_questions', questions)}
          />
        </fieldset>
      ) : null}

      {volunteerOnly ? null : (
        <>
          <fieldset className="mt-6 space-y-4 rounded-2xl border border-vog-brown/10 p-4">
            <legend className="px-1 text-sm font-semibold text-vog-brown">
              Bank transfer details (donation site)
            </legend>
            <p className="text-xs text-vog-brown/60">
              Optional. Only the fields you fill in are shown on the donation
              form.
            </p>
            <TextField
              id="bank_name"
              label="Bank name"
              value={values.bank_name}
              onChange={(e) => set('bank_name', e.target.value)}
            />
            <TextField
              id="account_name"
              label="Account name"
              value={values.account_name}
              onChange={(e) => set('account_name', e.target.value)}
            />
            <TextField
              id="account_number"
              label="Account number"
              value={values.account_number}
              onChange={(e) => set('account_number', e.target.value)}
            />
            <TextArea
              id="payment_instructions"
              label="Payment instructions"
              value={values.payment_instructions}
              onChange={(e) => set('payment_instructions', e.target.value)}
            />
          </fieldset>

          <fieldset className="mt-6 space-y-3 rounded-2xl border border-vog-brown/10 p-4">
            <legend className="px-1 text-sm font-semibold text-vog-brown">
              QR code image (optional)
            </legend>
            <p className="text-xs text-vog-brown/60">
              Upload a payment QR image (PNG, JPG, WEBP, or SVG, max 5 MB). It
              shows on the donation form.
            </p>

            {qrPreviewUrl ? (
              <div className="flex items-center gap-4">
                <img
                  src={qrPreviewUrl}
                  alt="QR code preview"
                  className="h-24 w-24 rounded-xl border border-vog-brown/10 object-contain p-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    set('qr_code_path', '')
                    setQrPreviewUrl(null)
                  }}
                  className="rounded-lg border border-vog-brown/20 px-3 py-1.5 text-sm font-medium text-vog-brown transition hover:border-amber-700 hover:text-amber-800"
                >
                  Remove image
                </button>
              </div>
            ) : null}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              disabled={uploading}
              onChange={(e) => void handleImageChange(e.target.files?.[0])}
              className="block w-full text-sm text-vog-brown file:mr-4 file:rounded-lg file:border-0 file:bg-vog-brown file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-vog-brown-soft"
            />
            {uploading ? (
              <p className="text-sm text-vog-brown/70">Uploading…</p>
            ) : null}
          </fieldset>

          <fieldset className="mt-6 space-y-4 rounded-2xl border border-vog-brown/10 p-4">
            <legend className="px-1 text-sm font-semibold text-vog-brown">
              Contact (optional)
            </legend>
            <TextField
              id="contact_name"
              label="Contact name"
              value={values.contact_name}
              onChange={(e) => set('contact_name', e.target.value)}
            />
            <TextField
              id="contact_email"
              label="Contact email"
              type="email"
              value={values.contact_email}
              onChange={(e) => set('contact_email', e.target.value)}
            />
            <TextField
              id="contact_phone"
              label="Contact phone"
              value={values.contact_phone}
              onChange={(e) => set('contact_phone', e.target.value)}
            />
          </fieldset>

          <label className="mt-6 flex items-center gap-3 rounded-2xl border border-vog-brown/10 p-4">
            <input
              type="checkbox"
              className="h-5 w-5 accent-vog-green"
              checked={values.is_active}
              onChange={(e) => set('is_active', e.target.checked)}
            />
            <span className="text-sm text-vog-brown">
              <span className="font-medium">Active:</span> visible on both sites
              and accepting submissions. Uncheck to hide it.
            </span>
          </label>
        </>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
        <Button
          type="submit"
          disabled={submitting || uploading}
          className="sm:w-auto sm:px-8"
        >
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
          className="sm:w-auto sm:px-8"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
