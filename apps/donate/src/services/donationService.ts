import { AppError } from '@/lib/errors'
import { apiUrl, isApiConfigured } from '@/lib/api'
import type { DonationField, FieldErrors } from '@/types/donation'

export interface DonationSubmission {
  eventId: string
  fullName: string
  email: string
  phone: string
  amount: string
  currency: string
  paymentMethod: string
  message: string
  proof: File
}

export class DonationValidationError extends AppError {
  readonly fields: FieldErrors
  constructor(fields: FieldErrors) {
    super('Please fix the highlighted fields and try again.')
    this.fields = fields
  }
}

const MESSAGES: Record<string, string> = {
  not_found: 'This campaign could not be found. Please check the link you were given.',
  inactive: 'This campaign is no longer accepting donations.',
  too_large: 'The file is too large. Maximum size is 5 MB.',
}

// Sends the details and the receipt together as one multipart request.
// Uses XMLHttpRequest (not fetch) so the upload can report real progress.
export function submitDonation(
  submission: DonationSubmission,
  onProgress?: (percent: number) => void,
): Promise<{ id: string; proof_storage_path: string }> {
  if (!isApiConfigured()) {
    return Promise.reject(
      new AppError('The donation form is temporarily unavailable. Please try again later.'),
    )
  }

  const body = new FormData()
  for (const [key, value] of Object.entries(submission)) {
    if (key !== 'proof') body.append(key, value as string)
  }
  body.append('proof', submission.proof)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', apiUrl('/donations'))
    xhr.responseType = 'json'
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        // Leave the last 5% for the server to save the record.
        onProgress(Math.min(95, Math.round((event.loaded / event.total) * 100)))
      }
    }
    xhr.onerror = () =>
      reject(new AppError('We could not reach the server. Check your connection and try again.'))
    xhr.onload = () => {
      const data = xhr.response as
        | { id?: string; proof_storage_path?: string; error?: string; fields?: Record<string, string>; message?: string }
        | null
      if (xhr.status === 201 && data?.id && data.proof_storage_path) {
        onProgress?.(100)
        resolve({ id: data.id, proof_storage_path: data.proof_storage_path })
        return
      }
      if (xhr.status === 422 && data?.fields) {
        reject(new DonationValidationError(data.fields as Partial<Record<DonationField, string>>))
        return
      }
      reject(
        new AppError(
          (data?.error && MESSAGES[data.error]) ||
            data?.message ||
            'We could not save your donation. Please try again or contact the event organiser.',
        ),
      )
    }
    xhr.send(body)
  })
}
