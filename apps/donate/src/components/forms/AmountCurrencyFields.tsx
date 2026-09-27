import { CURRENCIES, type CurrencyCode } from '@/config/currencies'
import { SelectField } from '@/components/ui/SelectField'
import { TextField } from '@/components/ui/TextField'

interface AmountCurrencyFieldsProps {
  amount: string
  currency: CurrencyCode
  amountError?: string
  currencyError?: string
  onAmountChange: (value: string) => void
  onCurrencyChange: (value: CurrencyCode) => void
}

export function AmountCurrencyFields({
  amount,
  currency,
  amountError,
  currencyError,
  onAmountChange,
  onCurrencyChange,
}: AmountCurrencyFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8.5rem]">
      <TextField
        id="amount"
        label="Donation amount"
        inputMode="decimal"
        autoComplete="off"
        value={amount}
        onChange={(event) => onAmountChange(event.target.value)}
        error={amountError}
        required
      />
      <SelectField
        id="currency"
        label="Currency"
        value={currency}
        onChange={(event) => onCurrencyChange(event.target.value as CurrencyCode)}
        options={CURRENCIES.map((item) => ({
          value: item.code,
          label: item.label,
        }))}
        error={currencyError}
        required
      />
    </div>
  )
}
