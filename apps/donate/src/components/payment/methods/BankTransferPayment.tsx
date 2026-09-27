import { CopyableField } from '@/components/ui/CopyableField'
import type { EventRecord } from '@/types/event'

interface BankTransferPaymentProps {
  event: EventRecord
}

export function BankTransferPayment({ event }: BankTransferPaymentProps) {
  const fields = [
    { label: 'Bank', value: event.bank_name },
    { label: 'Account name', value: event.account_name },
    { label: 'Account number', value: event.account_number },
  ].filter((field): field is { label: string; value: string } => Boolean(field.value))

  if (fields.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-vog-brown">Bank transfer details</h3>
      <div className="space-y-2">
        {fields.map((field) => (
          <CopyableField key={field.label} label={field.label} value={field.value} />
        ))}
      </div>
    </div>
  )
}
