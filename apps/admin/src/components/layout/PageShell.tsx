import type { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'

interface PageShellProps {
  children: ReactNode
  email?: string | null
  onSignOut?: () => void
  wide?: boolean
}

export function PageShell({ children, email, onSignOut, wide }: PageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-vog-cream/40">
      <Header email={email} onSignOut={onSignOut} />
      <main
        className={`mx-auto w-full flex-1 px-4 py-8 sm:px-6 sm:py-10 ${
          wide ? 'max-w-5xl' : 'max-w-md'
        }`}
      >
        {children}
      </main>
    </div>
  )
}
