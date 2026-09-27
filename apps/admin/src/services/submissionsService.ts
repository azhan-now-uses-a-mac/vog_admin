import { AppError } from '@/lib/errors'
import { apiFetch, describeError } from '@/lib/api'
import { download, stamp, toCsv } from '@/services/reportService'
import type { AdminEvent } from '@/types/event'
import type { EventDonation, EventVolunteer } from '@/types/submissions'

async function fetchRows<T>(path: string, label: string): Promise<T[]> {
  const { status, data } = await apiFetch<{ rows: T[] }>(path)
  if (status !== 200 || !data) throw new AppError(describeError(status, null, `Could not load ${label}.`))
  return data.rows
}

export function listEventDonations(eventId: string): Promise<EventDonation[]> {
  return fetchRows<EventDonation>(`/admin/events/${eventId}/donations`, 'donations')
}

export function listEventVolunteers(eventId: string): Promise<EventVolunteer[]> {
  return fetchRows<EventVolunteer>(`/admin/events/${eventId}/volunteers`, 'volunteer applications')
}

export const paymentMethodLabel = (method: string) =>
  method === 'qr_code' ? 'QR code' : method === 'bank_transfer' ? 'Bank transfer' : method

export function exportEventDonations(event: AdminEvent, rows: EventDonation[]) {
  const csv = toCsv(
    ['Submitted', 'Full name', 'Email', 'Phone', 'Amount', 'Currency', 'Payment method', 'Message', 'Proof of payment (link valid 7 days)'],
    rows.map((r) => [r.created_at, r.full_name, r.email, r.phone, r.amount, r.currency, paymentMethodLabel(r.payment_method), r.message ?? '', r.proof_url]),
  )
  download(`${event.slug}-donations-${stamp()}.csv`, csv)
}

export function exportEventVolunteers(event: AdminEvent, rows: EventVolunteer[]) {
  const yesNo = (v: boolean) => (v ? 'Yes' : 'No')
  const csv = toCsv(
    ['Submitted', 'Full name', 'Email', 'Phone', 'University', 'Course', 'Year of study', 'Area of residence', 'International licence', 'Has car', 'Commitment agreed', 'Message'],
    rows.map((r) => [r.created_at, r.full_name, r.email, r.phone, r.university, r.course, r.year_of_study, r.area_of_residence, yesNo(r.has_license), yesNo(r.has_car), yesNo(r.commitment_agreed), r.message ?? '']),
  )
  download(`${event.slug}-volunteers-${stamp()}.csv`, csv)
}
