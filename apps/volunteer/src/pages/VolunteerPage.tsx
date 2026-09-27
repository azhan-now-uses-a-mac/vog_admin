import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { VolunteerForm } from '@/components/forms/VolunteerForm'
import { PageShell } from '@/components/layout/PageShell'
import { EventHero } from '@/components/volunteer/EventHero'
import { SuccessState } from '@/components/volunteer/SuccessState'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { useEvent } from '@/hooks/useEvent'
import type { VolunteerInsert } from '@/types/volunteer'
export function VolunteerPage() { const { eventSlug } = useParams(); const { event, error, isLoading } = useEvent(eventSlug); const [submitted, setSubmitted] = useState<VolunteerInsert | null>(null)
  if (isLoading) return <PageShell><div className="animate-pulse space-y-4" aria-busy="true"><div className="mx-auto h-8 w-48 rounded-full bg-vog-cream"/><div className="h-96 rounded-3xl bg-vog-cream/80"/><span className="sr-only">Loading event</span></div></PageShell>
  if (error === 'invalid_slug' || error === 'not_found') return <NotFoundPage title="Event not found" message="We could not find an active volunteer event for this link. Please check the URL you were given." />
  if (error === 'inactive') return <NotFoundPage title="This event is closed" message="This event is not currently accepting volunteer applications." />
  if (error === 'unavailable' || !event) return <NotFoundPage title="Volunteer form unavailable" message="We could not load this event right now. Please try again in a few minutes." />
  return <PageShell>{submitted ? <SuccessState eventName={event.name} eventSlug={event.slug} volunteer={submitted} onReturn={() => setSubmitted(null)} /> : <><EventHero event={event}/><VolunteerForm event={event} onSuccess={setSubmitted}/></>}</PageShell>
}
