import { createMiddleware } from 'hono/factory'
import { createRemoteJWKSet, decodeJwt, jwtVerify } from 'jose'
import { query } from './db'

// Neon Auth (Managed Better Auth) signs short-lived JWTs. Neon injects the JWKS
// URL and base URL into the function when Auth is enabled on the branch.
const jwksUrl = process.env.NEON_AUTH_JWKS_URL
const baseUrl = process.env.NEON_AUTH_BASE_URL
const jwks = jwksUrl ? createRemoteJWKSet(new URL(jwksUrl)) : null
// Neon Auth may issue tokens with either its origin or its full base URL
// (which includes a path such as /neondb/auth) as `iss`. Accept both: they are
// the same trusted server, and the signature is always checked against its JWKS.
const issuer = baseUrl
  ? [...new Set([new URL(baseUrl).origin, baseUrl.replace(/\/+$/, '')])]
  : undefined

export type AdminVariables = { userId: string; email: string | null }

async function verify(authorization: string | undefined) {
  if (!jwks) {
    console.warn('[auth] NEON_AUTH_JWKS_URL is not set; rejecting token')
    return null
  }
  if (!authorization?.toLowerCase().startsWith('bearer ')) {
    console.warn('[auth] request has no bearer token')
    return null
  }
  const token = authorization.slice(7)
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer })
    if (!payload.sub) return null
    return {
      userId: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : null,
    }
  } catch (error) {
    // Log why (never the token itself) so rejected logins can be diagnosed.
    let claims = ''
    try {
      const { iss, aud } = decodeJwt(token)
      claims = ` token iss=${String(iss)} aud=${String(aud)} expected iss=${String(issuer)}`
    } catch {
      claims = ' (token is not a readable JWT)'
    }
    console.warn(`[auth] token rejected: ${(error as Error).message}.${claims}`)
    return null
  }
}

// Signed in AND listed in public.admin_users. A valid login alone is not enough.
export const requireAdmin = createMiddleware<{ Variables: AdminVariables }>(
  async (c, next) => {
    const identity = await verify(c.req.header('authorization'))
    if (!identity) return c.json({ error: 'unauthorized' }, 401)

    const rows = await query('select 1 from public.admin_users where user_id = $1', [
      identity.userId,
    ])
    if (rows.length === 0) return c.json({ error: 'not_admin' }, 403)

    c.set('userId', identity.userId)
    c.set('email', identity.email)
    await next()
  },
)

// For /admin/me: tells a signed-in user whether they are an admin, without a 403.
export async function identify(authorization: string | undefined) {
  const identity = await verify(authorization)
  if (!identity) return null
  const rows = await query('select 1 from public.admin_users where user_id = $1', [
    identity.userId,
  ])
  return { ...identity, isAdmin: rows.length > 0 }
}
