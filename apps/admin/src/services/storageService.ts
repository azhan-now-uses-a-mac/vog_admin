import { AppError } from '@/lib/errors'
import { apiFetch, describeError } from '@/lib/api'

// Uploads a QR image through the API into the public qr-codes bucket.
// Returns the stored key (saved on the event) and its public URL (for preview).
export async function uploadEventImage(
  folder: string,
  file: File,
): Promise<{ key: string; url: string | null }> {
  const body = new FormData()
  body.append('folder', folder)
  body.append('file', file)
  const { status, data } = await apiFetch<{ key?: string; url?: string | null; message?: string }>(
    '/admin/uploads/qr',
    { method: 'POST', body },
  )
  if (status !== 201 || !data?.key) {
    throw new AppError(describeError(status, data, 'Could not upload the image. Please try again.'))
  }
  return { key: data.key, url: data.url ?? null }
}
