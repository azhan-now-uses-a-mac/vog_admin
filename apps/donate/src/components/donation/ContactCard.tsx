import type { EventRecord } from '@/types/event'

interface ContactCardProps {
  event: EventRecord
}

export function ContactCard({ event }: ContactCardProps) {
  if (!event.contact_name && !event.contact_email && !event.contact_phone) {
    return null
  }

  return (
    <section className="mt-8 rounded-2xl border border-vog-brown/10 bg-vog-cream/50 p-5">
      <h2 className="text-lg font-semibold text-vog-brown">
        Having an issue with your donation?
      </h2>
      {event.contact_name ? (
        <p className="mt-1 text-vog-brown/80">Contact {event.contact_name}</p>
      ) : (
        <p className="mt-1 text-vog-brown/80">Contact the event organiser</p>
      )}
      <div className="mt-3 space-y-1 text-sm">
        {event.contact_email ? (
          <p>
            Email:{' '}
            <a className="font-medium text-vog-brown underline" href={`mailto:${event.contact_email}`}>
              {event.contact_email}
            </a>
          </p>
        ) : null}
        {event.contact_phone ? (
          <p>
            Phone:{' '}
            <a className="font-medium text-vog-brown underline" href={`tel:${event.contact_phone}`}>
              {event.contact_phone}
            </a>
          </p>
        ) : null}
      </div>
    </section>
  )
}
