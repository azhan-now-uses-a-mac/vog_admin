import { useEffect, useState } from 'react'
import { getEventBySlug } from '@/services/eventService'
import type { EventLookupError, EventRecord } from '@/types/event'

export function useEvent(slug: string | undefined) {
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [error, setError] = useState<EventLookupError | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      setEvent(null)

      const result = await getEventBySlug(slug)
      if (cancelled) return

      setEvent(result.event)
      setError(result.error)
      setIsLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [slug])

  return { event, error, isLoading }
}
