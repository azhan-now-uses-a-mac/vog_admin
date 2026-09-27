import type { EventRecord, OptionalStandardField } from '@/types/event'
import { YEARS_OF_STUDY, type FieldErrors, type VolunteerFormValues } from '@/types/volunteer'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[+]?[\d\s()-]{7,20}$/
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const MAX_MESSAGE_LENGTH = 2000

export function isValidEventSlug(slug: string | undefined): slug is string { return Boolean(slug && SLUG_PATTERN.test(slug) && slug.length <= 80) }
export function validateVolunteerForm(values: VolunteerFormValues, event: EventRecord): FieldErrors {
  const errors: FieldErrors = {}
  const hidden = event.volunteer_hidden_fields ?? []
  const ask = (f: OptionalStandardField) => !hidden.includes(f)
  const required = [
    ['fullName', values.fullName, 'Please enter your full name.', true],
    ['university', values.university, 'Please enter your university.', ask('university')],
    ['course', values.course, 'Please enter your course.', ask('course')],
    ['areaOfResidence', values.areaOfResidence, 'Please enter your area of residence.', ask('area_of_residence')],
  ] as const
  for (const [key, value, message, asked] of required) {
    if (!asked) continue
    if (value.trim().length < 2) errors[key] = message
    else if (value.trim().length > 160) errors[key] = 'This value is too long.'
  }
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Please enter a valid email address.'
  const phone = values.phone.trim()
  if (!PHONE_PATTERN.test(phone) || phone.replace(/\D/g, '').length < 7) errors.phone = 'Please enter a valid phone number.'
  if (ask('year_of_study') && !(YEARS_OF_STUDY as readonly string[]).includes(values.yearOfStudy)) errors.yearOfStudy = 'Please select your year of study.'
  if (ask('driving')) {
    if (values.hasLicense !== 'yes' && values.hasLicense !== 'no') errors.hasLicense = 'Please choose Yes or No.'
    else if (values.hasLicense === 'yes' && values.hasCar !== 'yes' && values.hasCar !== 'no') errors.hasCar = 'Please choose Yes or No.'
  }
  if (!values.commitment) errors.commitment = 'Please tick this box to submit your application.'
  for (const q of event.volunteer_questions ?? []) {
    const a = (values.answers[q.id] ?? '').trim()
    if (q.required && !a) errors[`answer:${q.id}`] = q.type === 'yes_no' ? 'Please choose Yes or No.' : 'This question is required.'
    else if (a.length > 500) errors[`answer:${q.id}`] = 'Answer is too long.'
  }
  if (values.message.length > MAX_MESSAGE_LENGTH) errors.message = 'Message is too long.'
  if (!event.is_active) errors.fullName = 'This event is not currently accepting volunteer applications.'
  return errors
}
