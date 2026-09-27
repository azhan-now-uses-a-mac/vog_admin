import type { TextareaHTMLAttributes } from 'react'
import { classNames } from '@/lib/format'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export function TextArea({ id, label, error, className, ...props }: TextAreaProps) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-vog-brown">
        {label}
      </label>
      <textarea
        id={id}
        className={classNames(
          'input-control min-h-28 h-auto resize-y py-3',
          className,
        )}
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
