import type { ReactNode } from 'react'
import type { EventRecord } from '@/types/event'

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-white/70 p-3 text-left">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-vog-green">{label}</p>
      <p className="mt-0.5 whitespace-pre-line text-sm text-vog-brown">{children}</p>
    </div>
  )
}

export function EventHero({ event }: { event: EventRecord }) {
  const description = event.volunteer_description ?? event.description
  const hasInfo = event.volunteer_date || event.volunteer_location || event.volunteer_spots || event.volunteer_requirements
  return <section className="mb-8 rounded-3xl border border-vog-brown/10 bg-vog-cream/65 p-6 text-center sm:p-8">
    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-vog-green">Volunteer opportunity</p>
    <h1 className="text-3xl font-semibold tracking-tight text-vog-brown sm:text-4xl">{event.name}</h1>
    {description ? <p className="mx-auto mt-4 max-w-lg whitespace-pre-line text-sm leading-snug text-vog-brown/80">{description}</p> : null}
    {hasInfo ? (
      <div className="mx-auto mt-5 grid max-w-lg gap-2 sm:grid-cols-2">
        {event.volunteer_date ? <Info label="Date & time">{event.volunteer_date}</Info> : null}
        {event.volunteer_location ? <Info label="Location">{event.volunteer_location}</Info> : null}
        {event.volunteer_spots ? <Info label="Volunteers needed">{event.volunteer_spots}</Info> : null}
        {event.volunteer_requirements ? <div className="sm:col-span-2"><Info label="Requirements & what to bring">{event.volunteer_requirements}</Info></div> : null}
      </div>
    ) : null}
  </section>
}
