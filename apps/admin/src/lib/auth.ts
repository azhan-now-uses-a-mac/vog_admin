import { createAuthClient } from '@neondatabase/auth'

const AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL ?? ''

// Neon Auth (Managed Better Auth). Default vanilla adapter: signIn.email,
// signUp.email, getSession, signOut, token.
export const authClient = AUTH_URL ? createAuthClient(AUTH_URL) : null

export function isAuthConfigured(): boolean {
  return authClient !== null
}

// The API accepts short-lived JWTs (15 minutes). Reuse one until it is close
// to expiring instead of fetching a new token on every request.
let cached: { token: string; expiresAt: number } | null = null

function expiryOf(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : 0
  } catch {
    return 0
  }
}

const looksLikeJwt = (value: unknown): value is string =>
  typeof value === 'string' && value.split('.').length === 3

export async function getAccessToken(): Promise<string | null> {
  if (!authClient) return null
  if (cached && cached.expiresAt - Date.now() > 60_000) return cached.token

  // Neon Auth returns the JWT in a `set-auth-jwt` header on get-session, and
  // the SDK puts it on `session.token` (this is what its own getJWTToken does).
  const { data: session } = await authClient.getSession()
  const sessionToken = session?.session?.token
  let token: string | null = looksLikeJwt(sessionToken) ? sessionToken : null

  // Fallback: ask the /token endpoint directly.
  if (!token) {
    const result = await authClient.token().catch(() => null)
    const fallback = result?.data?.token
    token = looksLikeJwt(fallback) ? fallback : null
  }

  if (!token) console.warn('[auth] signed in, but no API token was returned')
  cached = token ? { token, expiresAt: expiryOf(token) } : null
  return token
}

export function clearAccessToken() {
  cached = null
}

// Lets useAuth re-check the session after sign in / sign out.
type Listener = () => void
const listeners = new Set<Listener>()
export function onAuthChange(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
export function notifyAuthChange() {
  clearAccessToken()
  listeners.forEach((listener) => listener())
}
