import { SITE } from '@/config/site'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM17.75 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
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