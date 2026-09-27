import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { PageShell } from '@/components/layout/PageShell'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { useAuth } from '@/hooks/useAuth'
import { isApiConfigured } from '@/lib/api'
import { isAuthConfigured } from '@/lib/auth'
import { signOut } from '@/services/adminService'

export default function App() {
  const { status, email } = useAuth()

  if (!isApiConfigured() || !isAuthConfigured()) {
    return (
      <PageShell>
        <Alert tone="error" title="The admin is not configured">
          Set <code>VITE_API_URL</code> and <code>VITE_NEON_AUTH_URL</code>{' '}
          in the admin app's <code>.env</code>, then restart the dev server.
        </Alert>
      </PageShell>
    )
  }

  if (status === 'loading') {
    return (
      <PageShell>
        <div className="rounded-3xl border border-vog-brown/10 bg-white p-8 text-center">
          <p className="text-vog-brown/70">Loading…</p>
        </div>
      </PageShell>
    )
  }

  if (status === 'signed_out') {
    return <LoginPage />
  }

  if (status === 'not_admin') {
    return (
      <PageShell email={email}>
        <div className="rounded-3xl border border-vog-brown/10 bg-white p-6 shadow-sm sm:p-8">
          <Alert title="Waiting for approval">
            You're signed in as {email}, but this account hasn't been approved
            for the admin yet. Please ask a member of the A Vision of Good team to
            approve it, then reload this page.
          </Alert>
          <div className="mt-5">
            <Button variant="secondary" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </PageShell>
    )
  }

  return <DashboardPage email={email} />
}
