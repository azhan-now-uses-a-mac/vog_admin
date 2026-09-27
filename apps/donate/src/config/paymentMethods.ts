import type { EventRecord } from '@/types/event'

export const PAYMENT_METHODS = [
  {
    id: 'qr_code',
    label: 'QR Code',
    description: 'Scan the event QR code and upload your payment proof.',
    isAvailable: (event: EventRecord) => Boolean(event.qr_code_url),
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    description: 'Transfer to the event bank account and upload your receipt.',
    isAvailable: (event: EventRecord) =>
      Boolean(event.bank_name || event.account_name || event.account_number),
  },
] as const

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id']

export const PAYMENT_METHOD_IDS = PAYMENT_METHODS.map((method) => method.id)

export function isPaymentMethodId(value: string): value is PaymentMethodId {
  return PAYMENT_METHOD_IDS.includes(value as PaymentMethodId)
}

export function getAvailablePaymentMethods(event: EventRecord) {
  return PAYMENT_METHODS.filter((method) => method.isAvailable(event))
}
