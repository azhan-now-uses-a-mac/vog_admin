import { SITE } from '@/config/site'

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM17.75 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M12.04 2c-5.5 0-9.96 4.45-9.96 9.94 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.37a9.93 9.93 0 0 0 4.79 1.22h.01c5.5 0 9.96-4.46 9.96-9.95C22.01 6.45 17.54 2 12.04 2Zm5.77 14.17c-.24.68-1.4 1.3-1.94 1.35-.5.05-1.12.07-1.8-.11-.41-.11-.94-.31-1.62-.6-2.85-1.23-4.7-4.1-4.84-4.29-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09.99-2.38.24-.27.64-.39.86-.39h.62c.2 0 .46-.08.72.55.24.62.83 2.14.9 2.29.07.15.12.33.02.53-.1.2-.15.33-.3.51-.15.18-.31.4-.44.54-.15.15-.3.31-.13.6.17.3.77 1.27 1.65 2.06 1.13 1.01 2.08 1.33 2.39 1.48.3.15.48.13.66-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.72.81 2.01.96.3.15.49.22.56.34.08.13.08.74-.16 1.42Z" />
    </svg>
  )
}

export function Header() {
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

      <div className="relative mx-auto flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-8 sm:py-5">
        <div className="flex min-w-0 items-center gap-3">
          <a
            href={SITE.mainSiteUrl}
            className="shrink-0"
            aria-label={`${SITE.name} home`}
          >
            <img
              src="/logo.png"
              alt=""
              className="h-12 w-12 rounded-full bg-white/95 object-contain p-0.5 sm:h-14 sm:w-14"
            />
          </a>

          <div className="flex items-center gap-2">
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Follow us on Instagram"
              className="rounded-full p-2 text-white hover:bg-white/10"
            >
              <InstagramIcon />
            </a>

            <a
              href={SITE.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Join our WhatsApp group"
              className="rounded-full p-2 text-white hover:bg-white/10"
            >
              <WhatsAppIcon />
            </a>
          </div>
        </div>

        <div className="min-w-0 text-right">
          <p className="truncate text-[24px] font-light tracking-tight">
            {SITE.name}
          </p>

          <p
            className="text-[20px] text-white/80"
            lang="ar"
            dir="rtl"
          >
            {SITE.arabicName}
          </p>
        </div>
      </div>
    </header>
  )
}