import { getAvailablePaymentMethods, type PaymentMethodId } from '@/config/paymentMethods'
import { classNames } from '@/lib/format'
import type { EventRecord } from '@/types/event'

interface PaymentMethodSelectorProps {
  event: EventRecord
  value: PaymentMethodId | ''
  error?: string
  onChange: (value: PaymentMethodId) => void
}

export function PaymentMethodSelector({
  event,
  value,
  error,
  onChange,
}: PaymentMethodSelectorProps) {
  const methods = getAvailablePaymentMethods(event)

  if (methods.length === 0) {
    return (
      <p className="text-sm text-amber-800">
        Payment instructions have not been published for this event yet.
      </p>
    )
  }

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-vog-brown">Payment method</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {methods.map((method) => {
          const selected = value === method.id
          return (
            <label
              key={method.id}
              className={classNames(
                'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition',
                selected
                  ? 'border-vog-green bg-vog-cream/80'
                  : 'border-vog-brown/15 bg-white hover:border-vog-green/50',
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={selected}
                onChange={() => onChange(method.id)}
                className="mt-1 accent-vog-green"
              />
              <span>
                <span className="block font-semibold text-vog-brown">{method.label}</span>
                <span className="mt-1 block text-sm text-vog-brown/70">
                  {method.description}
                </span>
              </span>
            </label>
          )
        })}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-amber-800">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
