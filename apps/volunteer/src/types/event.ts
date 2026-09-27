export type QuestionType = 'text' | 'yes_no' | 'choice'
export interface VolunteerQuestion {
  id: string
  label: string
  type: QuestionType
  required: boolean
  options: string[]
}

export type OptionalStandardField = 'university' | 'course' | 'year_of_study' | 'area_of_residence' | 'driving'

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
  volunteer_hidden_fields: OptionalStandardField[]
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
