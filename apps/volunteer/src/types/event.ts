export type QuestionType = 'text' | 'yes_no' | 'choice'
export interface VolunteerQuestion {
  id: string
  label: string
  type: QuestionType
  required: boolean
  options: string[]
}

export interface EventRecord {
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
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  is_active: boolean
  created_at: string
}
export type EventLookupError = 'not_found' | 'inactive' | 'invalid_slug' | 'unavailable'
export interface EventSummary {
  id: string
  name: string
  slug: string
  description: string | null
  volunteer_description: string | null
  volunteer_date: string | null
  volunteer_location: string | null
}
