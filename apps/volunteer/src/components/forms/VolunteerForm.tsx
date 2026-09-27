import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { CheckboxField } from '@/components/ui/CheckboxField'
import { SelectField } from '@/components/ui/SelectField'
import { TextArea } from '@/components/ui/TextArea'
import { TextField } from '@/components/ui/TextField'
import { YesNoField } from '@/components/ui/YesNoField'
import { toUserMessage } from '@/lib/errors'
import { MAX_MESSAGE_LENGTH, validateVolunteerForm } from '@/lib/validation'
import { VolunteerValidationError, submitVolunteer } from '@/services/volunteerService'
import type { EventRecord } from '@/types/event'
import { YEARS_OF_STUDY, type FieldErrors, type VolunteerFormValues, type VolunteerInsert } from '@/types/volunteer'

const initialValues: VolunteerFormValues = { fullName: '', email: '', phone: '', university: '', course: '', yearOfStudy: '', areaOfResidence: '', hasLicense: '', hasCar: '', commitment: false, message: '' }

export function VolunteerForm({ event, onSuccess }: { event: EventRecord; onSuccess: (volunteer: VolunteerInsert) => void }) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  function update<K extends keyof VolunteerFormValues>(key: K, value: VolunteerFormValues[K]) { setValues((current) => ({ ...current, [key]: value })) }
  // No licence means no car question, so clear any earlier answer.
  function updateLicense(value: VolunteerFormValues['hasLicense']) { setValues((current) => ({ ...current, hasLicense: value, hasCar: value === 'yes' ? current.hasCar : '' })) }
  const hasLicense = values.hasLicense === 'yes'
  async function handleSubmit(nativeEvent: FormEvent<HTMLFormElement>) {
    nativeEvent.preventDefault(); setFormError(null)
    const nextErrors = validateVolunteerForm(values, event); setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setIsSubmitting(true)
    try {
      const saved = await submitVolunteer(event.id, values)
      const volunteer: VolunteerInsert = { id: saved.id, event_id: event.id, full_name: values.fullName.trim(), email: values.email.trim(), phone: values.phone.trim(), university: values.university.trim(), course: values.course.trim(), year_of_study: values.yearOfStudy, area_of_residence: values.areaOfResidence.trim(), has_license: hasLicense, has_car: hasLicense && values.hasCar === 'yes', commitment_agreed: values.commitment, message: values.message.trim() || null }
      onSuccess(volunteer)
    } catch (error) {
      if (error instanceof VolunteerValidationError) setErrors(error.fields)
      setFormError(toUserMessage(error, 'Something went wrong while submitting your application. Please try again.')) }
    finally { setIsSubmitting(false) }
  }
  return <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-vog-brown/10 bg-white p-5 shadow-sm sm:p-8" noValidate>
    <div><h2 className="text-xl font-semibold text-vog-brown">Your volunteer application</h2><p className="mt-1 text-sm text-vog-brown/70">Fields marked required are needed to submit your application.</p></div>
    {formError ? <Alert tone="error">{formError}</Alert> : null}
    <TextField id="fullName" label="Full Name" autoComplete="name" value={values.fullName} onChange={(e) => update('fullName', e.target.value)} error={errors.fullName} required />
    <TextField id="email" label="Email" type="email" autoComplete="email" value={values.email} onChange={(e) => update('email', e.target.value)} error={errors.email} required />
    <TextField id="phone" label="Phone Number" type="tel" autoComplete="tel" value={values.phone} onChange={(e) => update('phone', e.target.value)} error={errors.phone} required />
    <TextField id="university" label="University" autoComplete="organization" value={values.university} onChange={(e) => update('university', e.target.value)} error={errors.university} required />
    <TextField id="course" label="Course" value={values.course} onChange={(e) => update('course', e.target.value)} error={errors.course} required />
    <SelectField id="yearOfStudy" label="Year of Study" options={YEARS_OF_STUDY} placeholder="Select your year" value={values.yearOfStudy} onChange={(e) => update('yearOfStudy', e.target.value)} error={errors.yearOfStudy} required />
    <TextField id="areaOfResidence" label="Area of Residence" autoComplete="address-level2" value={values.areaOfResidence} onChange={(e) => update('areaOfResidence', e.target.value)} error={errors.areaOfResidence} required />
    <YesNoField id="hasLicense" label="Do you have a valid international driving licence?" value={values.hasLicense} onChange={updateLicense} error={errors.hasLicense} />
    {hasLicense ? <YesNoField id="hasCar" label="Do you have a car?" value={values.hasCar} onChange={(v) => update('hasCar', v)} error={errors.hasCar} /> : null}
    <TextArea id="message" label="Message (optional)" value={values.message} onChange={(e) => update('message', e.target.value)} error={errors.message} maxLength={MAX_MESSAGE_LENGTH} placeholder="Anything you would like the organisers to know" />
    <CheckboxField id="commitment" checked={values.commitment} onChange={(v) => update('commitment', v)} error={errors.commitment} label="I understand that if I am selected, I will attend the event and follow the organisers' instructions to the best of my ability." />
    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Submit application'}</Button>
  </form>
}
