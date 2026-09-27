import type { PaymentMethodId } from '@/config/paymentMethods'
import { BankTransferPayment } from '@/components/payment/methods/BankTransferPayment'
import { QrCodePayment } from '@/components/payment/methods/QrCodePayment'
import type { EventRecord } from '@/types/event'
import type { ComponentType } from 'react'

const PAYMENT_INSTRUCTION_VIEWS: Record<
  PaymentMethodId,
  ComponentType<{ event: EventRecord }>
> = {
  qr_code: QrCodePayment,
  bank_transfer: BankTransferPayment,
}

interface PaymentInstructionsProps {
  event: EventRecord
  method: PaymentMethodId | ''
}

export function PaymentInstructions({ event, method }: PaymentInstructionsProps) {
  if (!method) {
    return null
  }

  const View = PAYMENT_INSTRUCTION_VIEWS[method]
  if (!View) {
    return null
  }

  return (
    <section className="space-y-4 rounded-2xl border border-vog-brown/10 bg-vog-cream/40 p-4 sm:p-5">
      <View event={event} />
      {event.payment_instructions ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-vog-brown/80">
          {event.payment_instructions}
        </p>
      ) : null}
    </section>
  )
}
