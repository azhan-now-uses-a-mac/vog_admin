export type YesNo = 'yes' | 'no' | ''

export const YEARS_OF_STUDY = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5+', 'Postgraduate', 'Not a student'] as const

export interface VolunteerInsert {
  id: string
  event_id: string
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
}
export type VolunteerField = keyof VolunteerFormValues
export type FieldErrors = Partial<Record<VolunteerField, string>>
