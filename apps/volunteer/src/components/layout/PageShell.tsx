import type { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { SITE } from '@/config/site'

interface PageShellProps {
  children: ReactNode
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
      <footer className="border-t border-vog-brown/10 px-4 py-6 text-center text-sm text-vog-brown/70">
        <a href={SITE.mainSiteUrl} className="font-medium text-vog-brown hover:text-vog-pattern">
          {SITE.name}
        </a>
        <span> · Volunteer applications are collected for event coordination.</span>
      </footer>
    </div>
  )
}
