import { AppError } from '@/lib/errors'
import { apiGet, isApiConfigured } from '@/lib/api'
import { isValidEventSlug } from '@/lib/validation'
import type { EventLookupError, EventRecord, EventSummary } from '@/types/event'

export async function listActiveEvents(): Promise<EventSummary[]> {
  if (!isApiConfigured()) return []
  try {
    const { status, data } = await apiGet<{ events: EventSummary[] }>('/events')
    return status === 200 && data ? data.events : []
  } catch {
    return []
  }
}

export type EventLookupResult = { event: EventRecord; error: null } | { event: null; error: EventLookupError }

export async function getEventBySlug(slug: string | undefined): Promise<EventLookupResult> {
  if (!isValidEventSlug(slug)) return { event: null, error: 'invalid_slug' }
  try {
    const { status, data } = await apiGet<{ event: EventRecord }>(`/events/${encodeURIComponent(slug)}`)
    if (status === 200 && data?.event) return { event: data.event, error: null }
    if (status === 404 || status === 400) return { event: null, error: 'not_found' }
    if (status === 410) return { event: null, error: 'inactive' }
    return { event: null, error: 'unavailable' }
  } catch (error) {
    if (error instanceof AppError) return { event: null, error: 'unavailable' }
    throw error
  }
}
