import { SITE } from '@/config/site'

interface HeaderProps {
  email?: string | null
  onSignOut?: () => void
}

export function Header({ email, onSignOut }: HeaderProps) {
  return (
    <header className="relative overflow-hidden bg-[#2B1C12] text-white">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "url('/vog-pattern1.svg')",
          backgroundSize: '100px 100px',
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-8 sm:py-5">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src="/logo.png"
            alt=""
            className="h-11 w-11 shrink-0 rounded-full bg-white/95 object-contain p-0.5"
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{SITE.name}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">
              Admin
            </p>
          </div>
        </div>

        {email ? (
          <div className="flex items-center gap-3">
            <span className="hidden truncate text-sm text-white/80 sm:inline">
              {email}
            </span>
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-lg border border-white/25 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
