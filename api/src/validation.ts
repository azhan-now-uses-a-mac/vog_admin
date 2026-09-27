// Server-side checks. The browser validates too, but the API never trusts it.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^[+]?[\d\s()-]{7,20}$/
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CURRENCY = /^[A-Z]{3}$/

export const MAX_MESSAGE = 2000
export const MAX_PROOF_BYTES = 5 * 1024 * 1024
export const MAX_QR_BYTES = 5 * 1024 * 1024

export const PROOF_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
}
export const QR_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

export type Errors = Record<string, string>

export const isSlug = (v: unknown): v is string =>
  typeof v === 'string' && SLUG.test(v) && v.length >= 2 && v.length <= 80
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v)

export function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

export function optional(v: unknown): string | null {
  const s = str(v)
  return s.length > 0 ? s : null
}

function checkLength(errors: Errors, key: string, value: string, min: number, max: number, label: string) {
  if (value.length < min) errors[key] = `Please enter your ${label}.`
  else if (value.length > max) errors[key] = `${label[0].toUpperCase()}${label.slice(1)} is too long.`
}

function checkContact(errors: Errors, fullName: string, email: string, phone: string) {
  checkLength(errors, 'fullName', fullName, 2, 120, 'full name')
  if (!EMAIL.test(email)) errors.email = 'Please enter a valid email address.'
  if (!PHONE.test(phone) || phone.replace(/\D/g, '').length < 7) {
    errors.phone = 'Please enter a valid phone number.'
  }
}

export function validateDonation(input: Record<string, unknown>) {
  const errors: Errors = {}
  const fullName = str(input.fullName)
  const email = str(input.email)
  const phone = str(input.phone)
  const currency = str(input.currency)
  const paymentMethod = str(input.paymentMethod)
  const message = optional(input.message)
  const amountText = str(input.amount).replace(/,/g, '')

  checkContact(errors, fullName, email, phone)

  let amount = Number.NaN
  if (/^\d+(\.\d{1,2})?$/.test(amountText)) amount = Number(amountText)
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) {
    errors.amount = 'Please enter a valid donation amount.'
  }
  if (!CURRENCY.test(currency)) errors.currency = 'Please select a supported currency.'
  if (paymentMethod !== 'qr_code' && paymentMethod !== 'bank_transfer') {
    errors.paymentMethod = 'Please select a payment method.'
  }
  if (message && message.length > MAX_MESSAGE) errors.message = 'Message is too long.'

  return {
    errors,
    value: { fullName, email, phone, amount, currency, paymentMethod, message },
  }
}

export const YEARS_OF_STUDY = [
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5+',
  'Postgraduate',
  'Not a student',
] as const

// --- Admin-defined extra questions on the volunteer form ---------------------

export type QuestionType = 'text' | 'yes_no' | 'choice'
export interface VolunteerQuestion {
  id: string
  label: string
  type: QuestionType
  required: boolean
  options: string[]
}

const QUESTION_ID = /^[a-z0-9_-]{1,40}$/
const QUESTION_TYPES: QuestionType[] = ['text', 'yes_no', 'choice']
export const MAX_QUESTIONS = 20
export const MAX_ANSWER = 500

// Cleans the question list the admin sends. Returns null (and sets an error)
// if anything is malformed, so a broken list never reaches the database.
export function parseQuestions(raw: unknown, errors: Errors): VolunteerQuestion[] | null {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) { errors.volunteer_questions = 'Questions must be a list.'; return null }
  if (raw.length > MAX_QUESTIONS) { errors.volunteer_questions = `At most ${MAX_QUESTIONS} questions.`; return null }
  const out: VolunteerQuestion[] = []
  const seen = new Set<string>()
  for (const [i, item] of raw.entries()) {
    const q = (item ?? {}) as Record<string, unknown>
    const id = str(q.id)
    const label = str(q.label)
    const type = str(q.type) as QuestionType
    const options = Array.isArray(q.options) ? q.options.map(str).filter(Boolean).slice(0, 20) : []
    if (!QUESTION_ID.test(id) || seen.has(id)) { errors.volunteer_questions = `Question ${i + 1} has an invalid or duplicate id.`; return null }
    if (label.length < 1 || label.length > 160) { errors.volunteer_questions = `Question ${i + 1} needs a label (max 160 characters).`; return null }
    if (!QUESTION_TYPES.includes(type)) { errors.volunteer_questions = `Question ${i + 1} has an unknown type.`; return null }
    if (type === 'choice' && options.length < 2) { errors.volunteer_questions = `Question ${i + 1} needs at least two options.`; return null }
    if (options.some((o) => o.length > 80)) { errors.volunteer_questions = `Question ${i + 1}: options must be 80 characters or less.`; return null }
    seen.add(id)
    out.push({ id, label, type, required: q.required === true, options: type === 'choice' ? options : [] })
  }
  return out
}

// Checks the applicant's answers against the event's question list.
function validateAnswers(
  raw: unknown,
  questions: VolunteerQuestion[],
  errors: Errors,
): Record<string, string | boolean> {
  const answers = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const out: Record<string, string | boolean> = {}
  for (const q of questions) {
    const key = `answer:${q.id}`
    const v = answers[q.id]
    if (q.type === 'yes_no') {
      if (typeof v === 'boolean') out[q.id] = v
      else if (q.required) errors[key] = 'Please choose Yes or No.'
      continue
    }
    const text = str(v)
    if (!text) { if (q.required) errors[key] = 'This question is required.'; continue }
    if (q.type === 'choice' && !q.options.includes(text)) { errors[key] = 'Please pick one of the options.'; continue }
    if (text.length > MAX_ANSWER) { errors[key] = 'Answer is too long.'; continue }
    out[q.id] = text
  }
  return out
}

export function validateVolunteer(input: Record<string, unknown>, questions: VolunteerQuestion[] = []) {
  const errors: Errors = {}
  const fullName = str(input.fullName)
  const email = str(input.email)
  const phone = str(input.phone)
  const university = str(input.university)
  const course = str(input.course)
  const areaOfResidence = str(input.areaOfResidence)
  const yearOfStudy = str(input.yearOfStudy)
  const hasLicense = input.hasLicense === true
  // A car only counts when there is a licence to drive it.
  const hasCar = hasLicense && input.hasCar === true
  const commitment = input.commitment === true
  const message = optional(input.message)

  checkContact(errors, fullName, email, phone)
  checkLength(errors, 'university', university, 2, 160, 'university')
  checkLength(errors, 'course', course, 2, 160, 'course')
  checkLength(errors, 'areaOfResidence', areaOfResidence, 2, 160, 'area of residence')
  if (!(YEARS_OF_STUDY as readonly string[]).includes(yearOfStudy)) {
    errors.yearOfStudy = 'Please select your year of study.'
  }
  if (typeof input.hasLicense !== 'boolean') {
    errors.hasLicense = 'Please tell us whether you have a valid international driving licence.'
  } else if (hasLicense && typeof input.hasCar !== 'boolean') {
    errors.hasCar = 'Please tell us whether you have a car.'
  }
  if (!commitment) errors.commitment = 'Please confirm you will attend if selected.'
  if (message && message.length > MAX_MESSAGE) errors.message = 'Message is too long.'
  const extraAnswers = validateAnswers(input.answers, questions, errors)

  return {
    errors,
    value: {
      fullName,
      email,
      phone,
      university,
      course,
      areaOfResidence,
      yearOfStudy,
      hasLicense,
      hasCar,
      commitment,
      message,
      extraAnswers,
    },
  }
}

export function validateEvent(input: Record<string, unknown>) {
  const errors: Errors = {}
  const name = str(input.name)
  const slug = str(input.slug)
  const contactEmail = optional(input.contact_email)

  if (name.length < 2 || name.length > 160) errors.name = 'Name must be 2 to 160 characters.'
  if (!isSlug(slug)) {
    errors.slug = 'Slug must be lowercase letters, numbers and single hyphens.'
  }
  if (contactEmail && !EMAIL.test(contactEmail)) errors.contact_email = 'Contact email is not valid.'

  const spotsText = str(input.volunteer_spots)
  let volunteerSpots: number | null = null
  if (spotsText) {
    volunteerSpots = /^\d{1,6}$/.test(spotsText) ? Number(spotsText) : Number.NaN
    if (!Number.isInteger(volunteerSpots) || volunteerSpots < 1 || volunteerSpots > 100_000) {
      errors.volunteer_spots = 'Volunteers needed must be a whole number.'
    }
  }
  const volunteerRequirements = optional(input.volunteer_requirements)
  if (volunteerRequirements && volunteerRequirements.length > 2000) {
    errors.volunteer_requirements = 'Requirements are too long (max 2000 characters).'
  }
  const volunteerQuestions = parseQuestions(input.volunteer_questions, errors) ?? []

  return {
    errors,
    value: {
      name,
      slug,
      description: optional(input.description),
      volunteer_description: optional(input.volunteer_description),
      volunteer_date: optional(input.volunteer_date)?.slice(0, 160) ?? null,
      volunteer_location: optional(input.volunteer_location)?.slice(0, 300) ?? null,
      volunteer_requirements: volunteerRequirements,
      volunteer_spots: volunteerSpots,
      volunteer_questions: volunteerQuestions,
      qr_code_path: optional(input.qr_code_path),
      bank_name: optional(input.bank_name),
      account_name: optional(input.account_name),
      account_number: optional(input.account_number),
      payment_instructions: optional(input.payment_instructions),
      contact_name: optional(input.contact_name),
      contact_email: contactEmail,
      contact_phone: optional(input.contact_phone),
      is_active: input.is_active !== false,
    },
  }
}

export function safeFileName(name: string, ext: string): string {
  const base = name.replace(/\.[^.]*$/, '').toLowerCase().replace(/[^a-z0-9-_]+/g, '-').slice(0, 40)
  return `${base || 'file'}.${ext}`
}
