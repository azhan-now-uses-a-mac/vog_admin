import type { ReactNode } from 'react'
import { classNames } from '@/lib/format'

interface CheckboxFieldProps {
  id: string
  label: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
}

export function CheckboxField({ id, label, checked, onChange, error }: CheckboxFieldProps) {
  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className={classNames(
          'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition',
          error ? 'border-amber-700/60' : 'border-[#d6cfc7] hover:border-[#b9aea3]',
        )}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 accent-vog-green"
        />
        <span className="text-sm leading-relaxed text-vog-brown">{label}</span>
      </label>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-amber-800">
          {error}
        </p>
      ) : null}
    </div>
  )
}
