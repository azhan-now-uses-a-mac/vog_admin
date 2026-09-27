import { AppError } from '@/lib/errors'
import { apiFetch, describeError } from '@/lib/api'
import { authClient, notifyAuthChange } from '@/lib/auth'
import type { AdminEvent, EventFormValues } from '@/types/event'

function requireAuth() {
  if (!authClient) throw new AppError('Sign-in is not configured. Set VITE_NEON_AUTH_URL.')
  return authClient
}

// The Neon Auth client throws (AuthApiError) on any non-2xx response rather
// than returning `{ error }`, so both shapes have to be handled or every
// failure, including a wrong password, shows up as a generic message.
async function authCall<T extends { error?: { message?: string } | null }>(
  call: () => Promise<T>,
  fallback: string,
): Promise<void> {
  let result: T
  try {
    result = await call()
  } catch (err) {
    if (err instanceof AppError) throw err
    const message = err instanceof Error && err.message ? err.message : fallback
    throw new AppError(message, err)
  }
  if (result.error) throw new AppError(result.error.message || fallback, result.error)
}

// --- Auth ------------------------------------------------------------------

export async function signIn(email: string, password: string): Promise<void> {
  await authCall(
    () => requireAuth().signIn.email({ email: email.trim(), password }),
    'Incorrect email or password.',
  )
  notifyAuthChange()
}

export async function signUp(name: string, email: string, password: string): Promise<void> {
  await authCall(
    () => requireAuth().signUp.email({ name: name.trim(), email: email.trim(), password }),
    'Could not create the account.',
  )
  notifyAuthChange()
}

export async function signOut(): Promise<void> {
  // A failed sign-out call must not keep the user "signed in" on screen.
  await authClient?.signOut().catch(() => null)
  notifyAuthChange()
}

export async function getAdminStatus(): Promise<{ email: string | null; isAdmin: boolean } | null> {
  const { status, data } = await apiFetch<{ email: string | null; isAdmin: boolean }>('/admin/me')
  if (status !== 200 || !data) return null
  return data
}

// --- Events ----------------------------------------------------------------

export async function listAllEvents(): Promise<AdminEvent[]> {
  const { status, data } = await apiFetch<{ events: AdminEvent[] }>('/admin/events')
  if (status !== 200 || !data) throw new AppError(describeError(status, null, 'Could not load events.'))
  return data.events
}

function toBody(values: EventFormValues) {
  return JSON.stringify({ ...values })
}

export async function createEvent(values: EventFormValues): Promise<void> {
  const { status, data } = await apiFetch<{ error?: string; fields?: Record<string, string> }>(
    '/admin/events',
    { method: 'POST', body: toBody(values) },
  )
  if (status !== 201) throw new AppError(describeError(status, data, 'Could not save the event.'))
}

export async function updateEvent(id: string, values: EventFormValues): Promise<void> {
  const { status, data } = await apiFetch<{ error?: string; fields?: Record<string, string> }>(
    `/admin/events/${id}`,
    { method: 'PUT', body: toBody(values) },
  )
  if (status !== 200) throw new AppError(describeError(status, data, 'Could not save the event.'))
}

export async function setEventActive(id: string, isActive: boolean): Promise<void> {
  const { status, data } = await apiFetch<{ error?: string }>(`/admin/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  })
  if (status !== 200) throw new AppError(describeError(status, data, 'Could not update the event.'))
}

// --- Password reset (emailed 6-digit code) ----------------------------------
// Codes work with Neon Auth's shared email sender; reset links would need
// custom SMTP, so the admin uses the code flow.

export async function requestPasswordReset(email: string): Promise<void> {
  await authCall(
    () => requireAuth().emailOtp.requestPasswordReset({ email: email.trim() }),
    'Could not send the reset code.',
  )
}

export async function resetPassword(email: string, code: string, password: string): Promise<void> {
  await authCall(
    () => requireAuth().emailOtp.resetPassword({ email: email.trim(), otp: code.trim(), password }),
    'That code did not work. Check it, or request a new one.',
  )
}
