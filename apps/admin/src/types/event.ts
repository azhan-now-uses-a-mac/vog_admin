export type QuestionType = 'text' | 'yes_no' | 'choice'
export interface VolunteerQuestion {
  id: string
  label: string
  type: QuestionType
  required: boolean
  options: string[]
}

// Standard application questions the admin can switch off per event.
export type OptionalStandardField = 'university' | 'course' | 'year_of_study' | 'area_of_residence' | 'driving'

export interface AdminEvent {
  id: string
  name: string
  slug: string
  description: string | null
  volunteer_description: string | null
  volunteer_date: string | null
  volunteer_location: string | null
  volunteer_requirements: string | null
  volunteer_spots: number | null
  volunteer_questions: VolunteerQuestion[]
  volunteer_hidden_fields: OptionalStandardField[]
  qr_code_path: string | null
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

// Fields the admin can edit. id / created_at are managed by the database.
export interface EventFormValues {
  name: string
  slug: string
  description: string
  volunteer_description: string
  volunteer_date: string
  volunteer_location: string
  volunteer_requirements: string
  volunteer_spots: string
  volunteer_questions: VolunteerQuestion[]
  volunteer_hidden_fields: OptionalStandardField[]
  bank_name: string
  account_name: string
  account_number: string
  payment_instructions: string
  qr_code_path: string
  contact_name: string
  contact_email: string
  contact_phone: string
  is_active: boolean
}

