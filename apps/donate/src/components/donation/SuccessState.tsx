import { Link } from 'react-router-dom'
import { buttonClassName } from '@/components/ui/Button'
import { formatAmount } from '@/lib/format'
import type { DonationInsert } from '@/types/donation'

interface SuccessStateProps {
  eventName: string
  eventSlug: string
  donation: DonationInsert
  onReturn: () => void
}

export function SuccessState({
  eventName,
  eventSlug,
  donation,
  onReturn,
}: SuccessStateProps) {
  return (
    <section className="rounded-3xl border border-vog-brown/10 bg-white p-6 text-center shadow-sm sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-vog-green">
        Received
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-vog-brown">
        Donation submitted successfully
      </h1>
      <p className="mt-4 text-lg text-vog-brown">
        JazakAllahu khayran for supporting A Vision of Good.
      </p>
      <p className="mt-3 text-vog-brown/75">
        Your donation submission and proof of payment for{' '}
        <span className="font-medium text-vog-brown">{eventName}</span> have been
        received.
      </p>
      <dl className="mx-auto mt-6 max-w-sm space-y-2 rounded-2xl bg-vog-cream/70 px-4 py-4 text-left text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-vog-brown/60">Event</dt>
          <dd className="font-medium">{eventName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-vog-brown/60">Amount</dt>
          <dd className="font-medium">{formatAmount(donation.amount, donation.currency)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-vog-brown/60">Reference</dt>
          <dd className="break-all font-medium">{donation.id}</dd>
        </div>
      </dl>
      <div className="mt-8">
        <Link
            to={`/${eventSlug}`}
            onClick={onReturn}
            className={buttonClassName()}
          >
            Return to donation page
          </Link>
      </div>
    </section>
  )
}
