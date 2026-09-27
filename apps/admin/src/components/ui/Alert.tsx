import type { ReactNode } from 'react'
import { classNames } from '@/lib/format'

interface AlertProps {
  title?: string
  children: ReactNode
  tone?: 'info' | 'error'
}

export function Alert({ title, children, tone = 'info' }: AlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={classNames(
        'rounded-2xl border px-4 py-3 text-sm',
        tone === 'error'
          ? 'border-amber-800/20 bg-amber-50 text-amber-950'
          : 'border-vog-green/25 bg-vog-cream text-vog-brown',
      )}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? 'mt-1' : undefined}>{children}</div>
    </div>
  )
}
