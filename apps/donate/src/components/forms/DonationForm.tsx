import { useMemo, useState, type FormEvent } from 'react'
import { AmountCurrencyFields } from '@/components/forms/AmountCurrencyFields'
import { PaymentInstructions } from '@/components/payment/PaymentInstructions'
import { PaymentMethodSelector } from '@/components/payment/PaymentMethodSelector'
import { ProofUpload } from '@/components/upload/ProofUpload'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextArea } from '@/components/ui/TextArea'
import { TextField } from '@/components/ui/TextField'
import { DEFAULT_CURRENCY } from '@/config/currencies'
import { getAvailablePaymentMethods, type PaymentMethodId } from '@/config/paymentMethods'
import { toUserMessage } from '@/lib/errors'
import { parseAmount, validateDonationForm } from '@/lib/validation'
import { DonationValidationError, submitDonation } from '@/services/donationService'
import type { DonationFormValues, DonationInsert, FieldErrors } from '@/types/donation'
import type { EventRecord } from '@/types/event'

interface DonationFormProps {
  event: EventRecord
  onSuccess: (donation: DonationInsert) => void
}

const initialValues: DonationFormValues = {
  fullName: '',
  email: '',
  phone: '',
  amount: '',
  currency: DEFAULT_CURRENCY,
  paymentMethod: '',
  message: '',
}

export function DonationForm({ event, onSuccess }: DonationFormProps) {
  const [values, setValues] = useState<DonationFormValues>(initialValues)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  const availableMethods = useMemo(
    () => getAvailablePaymentMethods(event).map((method) => method.id),
    [event],
  )

  function update<K extends keyof DonationFormValues>(key: K, value: DonationFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(nativeEvent: FormEvent<HTMLFormElement>) {
    nativeEvent.preventDefault()
    setFormError(null)

    const nextErrors = validateDonationForm(values, proofFile, event, availableMethods)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || !proofFile) {
      return
    }

    const amount = parseAmount(values.amount)
    if (amount === null || !values.paymentMethod) {
      return
    }

    setIsSubmitting(true)
    setUploadProgress(5)

    try {
      const saved = await submitDonation(
        {
          eventId: event.id,
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          amount: String(amount),
          currency: values.currency,
          paymentMethod: values.paymentMethod,
          message: values.message.trim(),
          proof: proofFile,
        },
        setUploadProgress,
      )

      const donation: DonationInsert = {
        id: saved.id,
        event_id: event.id,
        full_name: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        amount,
        currency: values.currency,
        payment_method: values.paymentMethod as PaymentMethodId,
        proof_storage_path: saved.proof_storage_path,
        message: values.message.trim() || null,
      }

      onSuccess(donation)
    } catch (error) {
      if (error instanceof DonationValidationError) {
        setErrors(error.fields)
      }
      setFormError(
        toUserMessage(
          error,
          'Something went wrong while submitting your donation. Please try again.',
        ),
      )
    } finally {
      setIsSubmitting(false)
      setUploadProgress(null)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-vog-brown/10 bg-white p-5 shadow-sm sm:p-8"
      noValidate
    >
      <div>
        <h2 className="text-xl font-semibold text-vog-brown">Your donation details</h2>
      </div>

      {formError ? <Alert tone="error">{formError}</Alert> : null}

      <TextField
        id="fullName"
        label="Full name"
        autoComplete="name"
        value={values.fullName}
        onChange={(eventValue) => update('fullName', eventValue.target.value)}
        error={errors.fullName}
        required
      />
      <TextField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={(eventValue) => update('email', eventValue.target.value)}
        error={errors.email}
        required
      />
      <TextField
        id="phone"
        label="Phone number"
        type="tel"
        autoComplete="tel"
        value={values.phone}
        onChange={(eventValue) => update('phone', eventValue.target.value)}
        error={errors.phone}
        required
      />

      <AmountCurrencyFields
        amount={values.amount}
        currency={values.currency}
        amountError={errors.amount}
        currencyError={errors.currency}
        onAmountChange={(value) => update('amount', value)}
        onCurrencyChange={(value) => update('currency', value)}
      />

      <PaymentMethodSelector
        event={event}
        value={values.paymentMethod}
        error={errors.paymentMethod}
        onChange={(value) => update('paymentMethod', value)}
      />

      <PaymentInstructions event={event} method={values.paymentMethod} />

      <ProofUpload
        file={proofFile}
        error={errors.proof}
        progress={uploadProgress}
        disabled={isSubmitting}
        onFileChange={(file) => {
          setProofFile(file)
          setErrors((current) => ({ ...current, proof: undefined }))
        }}
      />

      <TextArea
        id="message"
        label="Message (optional)"
        value={values.message}
        onChange={(eventValue) => update('message', eventValue.target.value)}
        error={errors.message}
        maxLength={2000}
        placeholder="Payment notes or anything we should know"
      />

      <Button type="submit" disabled={isSubmitting || availableMethods.length === 0}>
        {isSubmitting ? 'Submitting…' : 'Submit donation'}
      </Button>
    </form>
  )
}
