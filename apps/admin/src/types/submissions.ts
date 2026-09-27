export interface EventDonation {
  id: string
  created_at: string
  full_name: string
  email: string
  phone: string
  // numeric comes back from Postgres as text; parse with Number() for maths.
  amount: string
  currency: string
  payment_method: 'qr_code' | 'bank_transfer' | string
  message: string | null
  proof_storage_path: string
  // Signed link, valid for 7 days from when the page was loaded.
  proof_url: string
}

export interface EventVolunteer {
  id: string
  created_at: string
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

export type SubmissionKind = 'donations' | 'volunteers'
