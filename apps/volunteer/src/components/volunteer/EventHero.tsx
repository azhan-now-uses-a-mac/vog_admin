import type { EventRecord } from '@/types/event'

export function EventHero({ event }: { event: EventRecord }) {
  const description = event.volunteer_description ?? event.description
  return <section className="mb-8 rounded-3xl border border-vog-brown/10 bg-vog-cream/65 p-6 text-center sm:p-8">
    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-vog-green">Volunteer opportunity</p>
    <h1 className="text-3xl font-semibold tracking-tight text-vog-brown sm:text-4xl">{event.name}</h1>
    {description ? <p className="mx-auto mt-4 max-w-lg whitespace-pre-line text-sm leading-snug text-vog-brown/80">{description}</p> : null}
  </section>
}
