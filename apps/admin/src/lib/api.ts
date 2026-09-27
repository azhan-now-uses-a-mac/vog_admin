import { AppError } from '@/lib/errors'
import { getAccessToken } from '@/lib/auth'

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export function isApiConfigured(): boolean {
  return API_URL.length > 0
}

export interface ApiResponse<T> {
  status: number
  data: T | null
}

// Calls the Neon Function API with the signed-in admin's bearer token.
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  if (!isApiConfigured()) throw new AppError('The API is not configured. Set VITE_API_URL.')
  const token = await getAccessToken()
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers })
  } catch (error) {
    throw new AppError('Could not reach the API. Check your connection and try again.', error)
  }
  const data = (await response.json().catch(() => null)) as T | null
  return { status: response.status, data }
}

type ErrorBody = { error?: string; message?: string; fields?: Record<string, string> }

// Turns an API error body into one readable message.
export function describeError(status: number, data: ErrorBody | null, fallback: string): string {
  if (status === 401) return 'Your session has expired. Please sign in again.'
  if (status === 403) return 'Your account does not have admin access.'
  if (data?.fields) return Object.values(data.fields).join(' ')
  if (data?.message) return data.message
  return fallback
}
