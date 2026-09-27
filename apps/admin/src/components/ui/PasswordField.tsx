import type { InputHTMLAttributes } from 'react'
import { classNames } from '@/lib/format'

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
  visible: boolean
  // When set, a Show / Hide button appears on the label row.
  onToggleVisible?: () => void
}

export function PasswordField({
  id,
  label,
  error,
  visible,
  onToggleVisible,
  className,
  ...props
}: PasswordFieldProps) {
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-medium text-vog-brown">
          {label}
        </label>
        {onToggleVisible ? (
          <button
            type="button"
            onClick={onToggleVisible}
            aria-controls={id}
            aria-pressed={visible}
            className="text-sm font-medium text-vog-green hover:text-vog-pattern"
          >
            {visible ? 'Hide' : 'Show'}
          </button>
        ) : null}
      </div>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className={classNames('input-control', className)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-amber-800">
          {error}
        </p>
      ) : null}
    </div>
  )
}
