import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import type { EventRecord } from '@/types/event'

// wa.me wants the number as digits only, with the country code and no leading zeros.
function whatsappNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, '').replace(/^0+/, '')
  return digits.length >= 7 ? digits : null
}

function whatsappLink(event: EventRecord, phone: string): string | null {
  const number = whatsappNumber(phone)
  if (!number) return null
  const greeting = event.contact_name ? `Assalamu alaikum ${event.contact_name},` : 'Assalamu alaikum,'
  const message = `${greeting} I have a question about volunteering for "${event.name}".`
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export function ContactCard({ event }: { event: EventRecord }) {
  if (!event.contact_name && !event.contact_email && !event.contact_phone) return null
  const whatsapp = event.contact_phone ? whatsappLink(event, event.contact_phone) : null

  return (
    <section className="mt-8 rounded-2xl border border-vog-brown/10 bg-vog-cream/50 p-5">
      <h2 className="text-lg font-semibold text-vog-brown">Questions about volunteering?</h2>
      <p className="mt-1 text-vog-brown/80">
        {event.contact_name ? `Contact ${event.contact_name}` : 'Contact the event organiser'}
      </p>
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
      {whatsapp ? (
        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-semibold text-white transition hover:bg-[#1ebe5b]"
        >
          <WhatsAppIcon />
          Message on WhatsApp
        </a>
      ) : null}
    </section>
  )
}
