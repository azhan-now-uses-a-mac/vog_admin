import { Link } from 'react-router-dom'
import { PageShell } from '@/components/layout/PageShell'
import { useEventList } from '@/hooks/useEventList'
import { SITE } from '@/config/site'

export function HomePage() {
  const { events, isLoading } = useEventList()

  return (
    <PageShell>
      <section className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-vog-green">
          {SITE.shortName} Donations
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-vog-brown">
          Choose a campaign to support
        </h1>
        <p className="mt-4 text-vog-brown/75">
          Select a campaign below to make a donation. This site collects donation
          details and proof of payment. It does not process payments.
        </p>
      </section>

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-4" aria-busy="true" aria-live="polite">
            <div className="h-24 animate-pulse rounded-3xl bg-vog-cream" />
            <div className="h-24 animate-pulse rounded-3xl bg-vog-cream" />
            <div className="h-24 animate-pulse rounded-3xl bg-vog-cream" />
            <span className="sr-only">Loading campaigns</span>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-3xl border border-vog-brown/10 bg-white p-6 text-center sm:p-10">
            <h2 className="text-xl font-semibold text-vog-brown">
              No active campaigns right now
            </h2>
            <p className="mt-3 text-vog-brown/75">
              Please check back soon, or visit{' '}
              <a className="underline" href={SITE.mainSiteUrl}>
                {SITE.mainSiteUrl.replace('https://', '')}
              </a>
              .
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  to={`/${event.slug}`}
                  className="group block rounded-3xl border border-vog-brown/10 bg-white p-5 shadow-sm transition hover:border-vog-green hover:shadow-md sm:p-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-vog-brown">
                      {event.name}
                    </h2>
                    <span
                      aria-hidden="true"
                      className="text-vog-green transition group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </div>
                  {event.description ? (
                    <p className="mt-2 line-clamp-3 text-sm text-vog-brown/75">
                      {event.description}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-vog-green">
                    Donate to this campaign
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  )
}
