import { Link } from 'react-router-dom'
import { buttonClassName } from '@/components/ui/Button'
import type { VolunteerInsert } from '@/types/volunteer'

export function SuccessState({
  eventName,
  eventSlug,
  onReturn,
}: {
  eventName: string
  eventSlug: string
  volunteer: VolunteerInsert
  onReturn: () => void
}) {
  return (
    <section className="rounded-3xl border border-vog-brown/10 bg-white p-6 text-center shadow-sm sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-vog-green">
        Received
      </p>

      <h1 className="mt-3 text-3xl font-semibold text-vog-brown">
        Volunteer application received
      </h1>

      <p className="mt-4 text-lg text-vog-brown">
        JazakAllahu khayran for offering your time with A Vision of Good.
      </p>

      <p className="mt-3 text-vog-brown/75">
        Your volunteer application for{' '}
        <span className="font-medium text-vog-brown">{eventName}</span> has been received.
      </p>

      <div className="mt-8">
        <Link
          to={`/${eventSlug}`}
          onClick={onReturn}
          className={buttonClassName()}
        >
          Return to volunteer form
        </Link>
      </div>
    </section>
  )
}