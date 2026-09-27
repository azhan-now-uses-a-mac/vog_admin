import { AppError } from '@/lib/errors'

// Base URL of the Neon Function API (e.g. https://<branch>-api.compute....neon.tech).
const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export function isApiConfigured(): boolean {
  return API_URL.length > 0
}

export function apiUrl(path: string): string {
  return `${API_URL}${path}`
}

export interface ApiResult<T> {
  status: number
  data: T | null
}

// Returns the status and parsed JSON. Network failures throw an AppError.
export async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  if (!isApiConfigured()) {
    throw new AppError('The donation form is temporarily unavailable. Please try again later.')
  }
  let response: Response
  try {
    response = await fetch(apiUrl(path), { headers: { Accept: 'application/json' } })
  } catch (error) {
    throw new AppError('We could not reach the server. Check your connection and try again.', error)
  }
  const data = (await response.json().catch(() => null)) as T | null
  return { status: response.status, data }
}
