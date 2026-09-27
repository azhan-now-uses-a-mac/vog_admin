import type { CurrencyCode } from '@/config/currencies'
import type { PaymentMethodId } from '@/config/paymentMethods'

export interface DonationInsert {
  id: string
  event_id: string
  full_name: string
  email: string
  phone: string
  amount: number
  currency: CurrencyCode
  payment_method: PaymentMethodId
  proof_storage_path: string
  message: string | null
}

export interface DonationFormValues {
  fullName: string
  email: string
  phone: string
  amount: string
  currency: CurrencyCode
  paymentMethod: PaymentMethodId | ''
  message: string
}

export type DonationField = keyof DonationFormValues | 'proof'

export type FieldErrors = Partial<Record<DonationField, string>>
