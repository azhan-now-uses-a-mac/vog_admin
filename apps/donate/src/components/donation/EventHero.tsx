import type { EventRecord } from '@/types/event'

interface EventHeroProps {
  event: EventRecord
}

export function EventHero({ event }: EventHeroProps) {
  return (
    <section className="mb-8 text-center">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-vog-green">
        Donation
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-vog-brown sm:text-4xl">
        {event.name}
      </h1>
      {event.description ? (
        <p className="mx-auto mt-3 max-w-lg whitespace-pre-line text-sm leading-snug text-vog-brown/75">
          {event.description}
        </p>
      ) : null}
    </section>
  )
}
