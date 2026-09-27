import { AppError } from '@/lib/errors'
import { apiFetch, describeError } from '@/lib/api'

interface DonationRow {
  created_at: string
  event_name: string
  event_slug: string
  full_name: string
  email: string
  phone: string
  amount: number
  currency: string
  payment_method: string
  message: string | null
  proof_storage_path: string
  proof_url: string
}

interface VolunteerRow {
  created_at: string
  event_name: string
  event_slug: string
  full_name: string
  email: string
  phone: string
  university: string
  course: string
  year_of_study: string
  area_of_residence: string
  has_license: boolean
  has_car: boolean
  commitment_agreed: boolean
  message: string | null
}

// --- CSV helpers -----------------------------------------------------------

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  // Quote anything with commas, quotes or newlines. Prefix formula-like values
  // so Excel shows them as text instead of running them. Phone numbers such as
  // "+968 ..." are left alone.
  const safe = /^(=|@|\t|\r|[+-](?![\d\s(]))/.test(text) ? `'${text}` : text
  if (/[",\n\r]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`
  return safe
}

function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(','))
  // UTF-8 BOM so Excel opens accented characters correctly.
  return '﻿' + lines.join('\r\n')
}

function download(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const stamp = () => new Date().toISOString().slice(0, 10)

async function fetchRows<T>(path: string, label: string): Promise<T[]> {
  const { status, data } = await apiFetch<{ rows: T[] }>(path)
  if (status !== 200 || !data) {
    throw new AppError(describeError(status, null, `Could not load ${label}.`))
  }
  return data.rows
}

// --- Reports ---------------------------------------------------------------

export async function exportDonations(): Promise<number> {
  const rows = await fetchRows<DonationRow>('/admin/reports/donations', 'donations')
  const csv = toCsv(
    [
      'Submitted',
      'Event',
      'Event slug',
      'Full name',
      'Email',
      'Phone',
      'Amount',
      'Currency',
      'Payment method',
      'Message',
      'Proof of payment (link valid 7 days)',
    ],
    rows.map((r) => [
      r.created_at,
      r.event_name,
      r.event_slug,
      r.full_name,
      r.email,
      r.phone,
      r.amount,
      r.currency,
      r.payment_method,
      r.message ?? '',
      r.proof_url,
    ]),
  )
  download(`donations-${stamp()}.csv`, csv)
  return rows.length
}

export async function exportVolunteers(): Promise<number> {
  const rows = await fetchRows<VolunteerRow>('/admin/reports/volunteers', 'volunteers')
  const csv = toCsv(
    [
      'Submitted',
      'Event',
      'Event slug',
      'Full name',
      'Email',
      'Phone',
      'University',
      'Course',
      'Year of study',
      'Area of residence',
      'International licence',
      'Has car',
      'Commitment agreed',
      'Message',
    ],
    rows.map((r) => [
      r.created_at,
      r.event_name,
      r.event_slug,
      r.full_name,
      r.email,
      r.phone,
      r.university,
      r.course,
      r.year_of_study,
      r.area_of_residence,
      r.has_license ? 'Yes' : 'No',
      r.has_car ? 'Yes' : 'No',
      r.commitment_agreed ? 'Yes' : 'No',
      r.message ?? '',
    ]),
  )
  download(`volunteers-${stamp()}.csv`, csv)
  return rows.length
}
