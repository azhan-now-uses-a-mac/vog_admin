import { AppError } from '@/lib/errors'
import { apiUrl, isApiConfigured } from '@/lib/api'
import type { FieldErrors, VolunteerFormValues } from '@/types/volunteer'

export class VolunteerValidationError extends AppError {
  readonly fields: FieldErrors
  constructor(fields: FieldErrors) {
    super('Please fix the highlighted fields and try again.')
    this.fields = fields
  }
}

const MESSAGES: Record<string, string> = {
  not_found: 'This opportunity could not be found. Please check the link you were given.',
  inactive: 'This opportunity is no longer accepting applications.',
}

export async function submitVolunteer(eventId: string, values: VolunteerFormValues): Promise<{ id: string }> {
  if (!isApiConfigured()) throw new AppError('The volunteer form is temporarily unavailable. Please try again later.')
  let response: Response
  try {
    response = await fetch(apiUrl('/volunteers'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        university: values.university.trim(),
        course: values.course.trim(),
        areaOfResidence: values.areaOfResidence.trim(),
        yearOfStudy: values.yearOfStudy,
        hasLicense: values.hasLicense === 'yes',
        hasCar: values.hasLicense === 'yes' ? values.hasCar === 'yes' : false,
        commitment: values.commitment,
        message: values.message.trim(),
      }),
    })
  } catch (error) {
    throw new AppError('We could not reach the server. Check your connection and try again.', error)
  }
  const data = (await response.json().catch(() => null)) as { id?: string; error?: string; fields?: FieldErrors } | null
  if (response.status === 201 && data?.id) return { id: data.id }
  if (response.status === 422 && data?.fields) throw new VolunteerValidationError(data.fields)
  throw new AppError((data?.error && MESSAGES[data.error]) || 'We could not save your volunteer application. Please try again or contact the event organiser.')
}
