import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ContactCard } from '@/components/donation/ContactCard'
import { EventHero } from '@/components/donation/EventHero'
import { SuccessState } from '@/components/donation/SuccessState'
import { DonationForm } from '@/components/forms/DonationForm'
import { PageShell } from '@/components/layout/PageShell'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { useEvent } from '@/hooks/useEvent'
import type { DonationInsert } from '@/types/donation'

export function DonationPage() {
  const { eventSlug } = useParams()
  const { event, error, isLoading } = useEvent(eventSlug)
  const [submitted, setSubmitted] = useState<DonationInsert | null>(null)

  if (isLoading) {
    return (
      <PageShell>
        <div className="animate-pulse space-y-4" aria-busy="true" aria-live="polite">
          <div className="mx-auto h-8 w-48 rounded-full bg-vog-cream" />
          <div className="mx-auto h-10 w-72 rounded-full bg-vog-cream" />
          <div className="h-96 rounded-3xl bg-vog-cream/80" />
          <span className="sr-only">Loading event</span>
        </div>
      </PageShell>
    )
  }

  if (error === 'invalid_slug' || error === 'not_found') {
    return (
      <NotFoundPage
        title="Event not found"
        message="We could not find an active donation campaign for this link. Please check the URL you were given."
      />
    )
  }

  if (error === 'inactive') {
    return (
      <NotFoundPage
        title="This campaign is closed"
        message="This event is not currently accepting donations through this form."
      />
    )
  }

  if (error === 'unavailable' || !event) {
    return (
      <NotFoundPage
        title="Donation form unavailable"
        message="We could not load this campaign right now. Please try again in a few minutes."
      />
    )
  }

  return (
    <PageShell>
      {submitted ? (
        <SuccessState
          eventName={event.name}
          eventSlug={event.slug}
          donation={submitted}
          onReturn={() => setSubmitted(null)}
        />
      ) : (
        <>
          <EventHero event={event} />
          <DonationForm event={event} onSuccess={setSubmitted} />
          <ContactCard event={event} />
        </>
      )}
    </PageShell>
  )
}
