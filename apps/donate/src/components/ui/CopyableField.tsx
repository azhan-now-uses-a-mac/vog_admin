import { useState } from 'react'
import { classNames } from '@/lib/format'

interface CopyableFieldProps {
  label: string
  value: string
}

export function CopyableField({ label, value }: CopyableFieldProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-vog-brown/10 bg-vog-cream/60 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-vog-brown/60">
          {label}
        </p>
        <p className="truncate font-medium text-vog-brown">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => void copy()}
        className={classNames(
          'h-10 shrink-0 rounded-lg px-3 text-sm font-semibold',
          copied ? 'bg-vog-green text-white' : 'bg-vog-brown text-white',
        )}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
