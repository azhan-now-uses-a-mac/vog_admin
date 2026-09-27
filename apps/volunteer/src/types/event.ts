export interface EventRecord { id: string; name: string; slug: string; description: string | null; volunteer_description: string | null; is_active: boolean; created_at: string }
export type EventLookupError = 'not_found' | 'inactive' | 'invalid_slug' | 'unavailable'
export interface EventSummary { id: string; name: string; slug: string; description: string | null; volunteer_description: string | null }
