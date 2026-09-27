export type YesNo = 'yes' | 'no' | ''

export const YEARS_OF_STUDY = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5+', 'Postgraduate', 'Not a student'] as const

export interface VolunteerInsert {
  id: string
  event_id: string
  full_name: string
  email: string
  phone: string
  university: string | null
  course: string | null
  year_of_study: string | null
  area_of_residence: string | null
  has_license: boolean
  has_car: boolean
  commitment_agreed: boolean
  message: string | null
  extra_answers: Record<string, string | boolean>
}
export interface VolunteerFormValues {
  fullName: string
  email: string
  phone: string
  university: string
  course: string
  yearOfStudy: string
  areaOfResidence: string
  hasLicense: YesNo
  // Only asked when hasLicense is 'yes'.
  hasCar: YesNo
  commitment: boolean
  message: string
  // Answers to the event's extra questions, keyed by question id.
  // yes_no questions hold a YesNo, the others a string.
  answers: Record<string, string>
}
export type VolunteerField = keyof VolunteerFormValues
// Standard fields plus `answer:<question id>` for the extra questions.
export type FieldErrors = Partial<Record<VolunteerField | `answer:${string}`, string>>
