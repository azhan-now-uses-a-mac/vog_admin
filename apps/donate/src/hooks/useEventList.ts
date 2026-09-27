import { useEffect, useState } from 'react'
import { listActiveEvents } from '@/services/eventService'
import type { EventSummary } from '@/types/event'

export function useEventList() {
  const [events, setEvents] = useState<EventSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const result = await listActiveEvents()
      if (cancelled) return
      setEvents(result)
      setIsLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return { events, isLoading }
}
