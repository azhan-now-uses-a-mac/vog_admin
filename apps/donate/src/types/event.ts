export interface EventRecord {
  id: string
  name: string
  slug: string
  description: string | null
  qr_code_path: string | null
  // Public URL of the QR image, built by the API.
  qr_code_url: string | null
  bank_name: string | null
  account_name: string | null
  account_number: string | null
  payment_instructions: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  is_active: boolean
  created_at: string
}

export type EventLookupError =
  | 'not_found'
  | 'inactive'
  | 'invalid_slug'
  | 'unavailable'

export interface EventSummary {
  id: string
  name: string
  slug: string
  description: string | null
}
