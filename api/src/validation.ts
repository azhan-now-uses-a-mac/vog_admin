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

export function validateVolunteer(input: Record<string, unknown>) {
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

  return {
    errors,
    value: {
      name,
      slug,
      description: optional(input.description),
      volunteer_description: optional(input.volunteer_description),
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
