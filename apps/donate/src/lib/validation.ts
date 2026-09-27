import { CURRENCY_CODES, isCurrencyCode } from '@/config/currencies'
import {
  isPaymentMethodId,
  type PaymentMethodId,
} from '@/config/paymentMethods'
import { UPLOAD_CONFIG, formatFileSize } from '@/config/upload'
import type { DonationFormValues, FieldErrors } from '@/types/donation'
import type { EventRecord } from '@/types/event'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const PHONE_PATTERN = /^[+]?[\d\s()-]{7,20}$/

export const MAX_AMOUNT = 100_000_000
export const MAX_MESSAGE_LENGTH = 2000

export function isValidEventSlug(slug: string | undefined): slug is string {
  return Boolean(slug && SLUG_PATTERN.test(slug) && slug.length <= 80)
}

export function sanitizePhone(value: string): string {
  return value.trim()
}

export function parseAmount(value: string): number | null {
  const normalized = value.replace(/,/g, '').trim()
  if (!normalized) return null
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  const amount = Number(normalized)
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    return null
  }
  return amount
}

export function validateProofFile(file: File | null): string | undefined {
  if (!file) {
    return 'Proof of payment is required.'
  }

  const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
  const allowedExtension = UPLOAD_CONFIG.acceptedExtensions.includes(
    extension as (typeof UPLOAD_CONFIG.acceptedExtensions)[number],
  )
  const allowedMime =
    file.type === '' ||
    UPLOAD_CONFIG.acceptedMimeTypes.includes(
      file.type as (typeof UPLOAD_CONFIG.acceptedMimeTypes)[number],
    )

  if (!allowedExtension || !allowedMime) {
    return 'Please upload a JPG, JPEG, PNG, or PDF file.'
  }

  if (file.size > UPLOAD_CONFIG.maxFileSizeBytes) {
    return `The file is too large. Maximum size is ${formatFileSize(UPLOAD_CONFIG.maxFileSizeBytes)}.`
  }

  if (file.size === 0) {
    return 'The selected file appears to be empty.'
  }

  return undefined
}

export function validateDonationForm(
  values: DonationFormValues,
  proofFile: File | null,
  event: EventRecord,
  availablePaymentMethods: PaymentMethodId[],
): FieldErrors {
  const errors: FieldErrors = {}

  if (values.fullName.trim().length < 2) {
    errors.fullName = 'Please enter your full name.'
  } else if (values.fullName.trim().length > 120) {
    errors.fullName = 'Name is too long.'
  }

  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address.'
  }

  const phone = sanitizePhone(values.phone)
  const digitCount = phone.replace(/\D/g, '').length
  if (!PHONE_PATTERN.test(phone) || digitCount < 7) {
    errors.phone = 'Please enter a valid phone number.'
  }

  const amount = parseAmount(values.amount)
  if (amount === null) {
    errors.amount = 'Please enter a valid donation amount.'
  }

  if (!isCurrencyCode(values.currency) || !CURRENCY_CODES.includes(values.currency)) {
    errors.currency = 'Please select a supported currency.'
  }

  if (!values.paymentMethod || !isPaymentMethodId(values.paymentMethod)) {
    errors.paymentMethod = 'Please select a payment method.'
  } else if (!availablePaymentMethods.includes(values.paymentMethod)) {
    errors.paymentMethod = 'This payment method is not available for this event.'
  }

  if (values.message.length > MAX_MESSAGE_LENGTH) {
    errors.message = 'Message is too long.'
  }

  const proofError = validateProofFile(proofFile)
  if (proofError) {
    errors.proof = proofError
  }

  if (!event.is_active) {
    errors.paymentMethod = 'This event is not currently accepting donations.'
  }

  return errors
}

export function sanitizeStorageFileName(fileName: string): string {
  const parts = fileName.trim().split('.')
  const extension = (parts.pop() ?? 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  const base = parts.join('.').toLowerCase().replace(/[^a-z0-9-_]+/g, '-').slice(0, 40) || 'proof'
  return `${base}.${extension}`
}
