import { useEffect, useState } from 'react'
import { authClient, onAuthChange } from '@/lib/auth'
import { getAdminStatus } from '@/services/adminService'

export type AuthStatus = 'loading' | 'signed_out' | 'not_admin' | 'admin'

export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      if (!authClient) {
        setStatus('signed_out')
        return
      }
      setStatus('loading')
      // getSession throws on a non-2xx response; treat that as signed out.
      const { data } = await authClient.getSession().catch(() => ({ data: null }))
      if (cancelled) return
      if (!data?.user) {
        setEmail(null)
        setStatus('signed_out')
        return
      }
      setEmail(data.user.email ?? null)
      // Signed in; the API decides whether this account is an admin.
      const admin = await getAdminStatus().catch(() => null)
      if (cancelled) return
      setStatus(admin?.isAdmin ? 'admin' : 'not_admin')
    }

    void resolve()
    const unsubscribe = onAuthChange(() => void resolve())
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return { status, email }
}
