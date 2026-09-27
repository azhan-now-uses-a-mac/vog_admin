import { classNames } from '@/lib/format'
import type { YesNo } from '@/types/volunteer'

interface YesNoFieldProps {
  id: string
  label: string
  value: YesNo
  onChange: (value: YesNo) => void
  error?: string
}

const OPTIONS: { value: Exclude<YesNo, ''>; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

export function YesNoField({ id, label, value, onChange, error }: YesNoFieldProps) {
  return (
    <fieldset
      className="w-full"
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
    >
      <legend className="mb-1.5 block text-sm font-medium text-vog-brown">{label}</legend>
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((option) => {
          const selected = value === option.value
          return (
            <label
              key={option.value}
              className={classNames(
                'flex h-12 cursor-pointer items-center justify-center rounded-xl border text-sm font-medium transition',
                selected
                  ? 'border-vog-green bg-vog-green/10 text-vog-brown shadow-[0_0_0_3px_rgba(139,154,71,.22)]'
                  : 'border-[#d6cfc7] bg-white text-vog-brown/80 hover:border-[#b9aea3]',
                error && !selected ? 'border-amber-700/60' : '',
              )}
            >
              <input
                type="radio"
                name={id}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          )
        })}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-amber-800">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
