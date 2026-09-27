import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { OtpInput } from '@/components/ui/OtpInput'
import { PasswordField } from '@/components/ui/PasswordField'
import { TextField } from '@/components/ui/TextField'
import { PageShell } from '@/components/layout/PageShell'
import {
  requestPasswordReset,
  resetPassword,
  signIn,
  signUp,
} from '@/services/adminService'
import { toUserMessage } from '@/lib/errors'

type Mode = 'sign_in' | 'sign_up' | 'forgot_request' | 'forgot_reset'

const TITLES: Record<Mode, string> = {
  sign_in: 'Admin sign in',
  sign_up: 'Create admin account',
  forgot_request: 'Reset your password',
  forgot_reset: 'Choose a new password',
}

const SUBTITLES: Record<Mode, string> = {
  sign_in: 'Manage A Vision of Good campaigns.',
  sign_up:
    'New accounts need to be approved by the A Vision of Good team before they can use the admin.',
  forgot_request: 'Enter your account email and we will send you a 6-digit code.',
  forgot_reset: 'Enter the code from your email and choose a new password.',
}

const SUBMIT_LABELS: Record<Mode, string> = {
  sign_in: 'Sign in',
  sign_up: 'Create account',
  forgot_request: 'Send code',
  forgot_reset: 'Reset password',
}

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('sign_in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Sign up and reset both set a new password, so both confirm it.
  const choosingPassword = mode === 'sign_up' || mode === 'forgot_reset'

  function goTo(next: Mode) {
    setMode(next)
    setError(null)
    setNotice(null)
    setConfirmError(null)
    setPassword('')
    setConfirmPassword('')
    if (next !== 'forgot_reset') setCode('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setConfirmError(null)

    if (mode === 'forgot_reset' && !/^\d{6}$/.test(code)) {
      setError('Enter all 6 digits of the code.')
      return
    }
    if (choosingPassword && password.length < 8) {
      setError('Use a password of at least 8 characters.')
      return
    }
    if (choosingPassword && password !== confirmPassword) {
      setConfirmError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'sign_up') {
        await signUp(name, email, password)
      } else if (mode === 'sign_in') {
        await signIn(email, password)
      } else if (mode === 'forgot_request') {
        await requestPasswordReset(email)
        goTo('forgot_reset')
        setNotice(
          `If ${email.trim()} has an account, a 6-digit code is on its way. Check your inbox and spam folder.`,
        )
      } else {
        await resetPassword(email, code, password)
        // Sign straight in with the new password; useAuth takes it from here.
        await signIn(email, password)
      }
    } catch (err) {
      setError(toUserMessage(err, 'Something went wrong. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function resendCode() {
    setError(null)
    setNotice(null)
    try {
      await requestPasswordReset(email)
      setNotice('A new code has been sent.')
    } catch (err) {
      setError(toUserMessage(err, 'Could not send a new code. Please try again.'))
    }
  }

  return (
    <PageShell>
      <div className="rounded-3xl border border-vog-brown/10 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-vog-brown">{TITLES[mode]}</h1>
        <p className="mt-2 text-sm text-vog-brown/70">{SUBTITLES[mode]}</p>

        {notice ? (
          <div className="mt-4">
            <Alert>{notice}</Alert>
          </div>
        ) : null}
        {error ? (
          <div className="mt-4">
            <Alert tone="error">{error}</Alert>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'sign_up' ? (
            <TextField
              id="name"
              label="Your name"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          ) : null}

          <TextField
            id="email"
            label="Email"
            type="email"
            autoComplete="username"
            required
            readOnly={mode === 'forgot_reset'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {mode === 'forgot_reset' ? (
            <OtpInput
              id="code"
              label="6-digit code"
              value={code}
              onChange={setCode}
              disabled={submitting}
            />
          ) : null}

          {mode !== 'forgot_request' ? (
            <PasswordField
              id="password"
              label={mode === 'forgot_reset' ? 'New password' : 'Password'}
              autoComplete={choosingPassword ? 'new-password' : 'current-password'}
              required
              value={password}
              visible={showPassword}
              onToggleVisible={() => setShowPassword((v) => !v)}
              onChange={(e) => setPassword(e.target.value)}
            />
          ) : null}

          {choosingPassword ? (
            <PasswordField
              id="confirmPassword"
              label={mode === 'forgot_reset' ? 'Confirm new password' : 'Confirm password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              visible={showPassword}
              error={confirmError ?? undefined}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setConfirmError(null)
              }}
            />
          ) : null}

          {mode === 'sign_in' ? (
            <div className="-mt-1 text-right">
              <button
                type="button"
                onClick={() => goTo('forgot_request')}
                className="text-sm font-medium text-vog-green hover:text-vog-pattern"
              >
                Forgot password?
              </button>
            </div>
          ) : null}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : SUBMIT_LABELS[mode]}
          </Button>
        </form>

        <div className="mt-4 space-y-2 text-center text-sm">
          {mode === 'forgot_reset' ? (
            <button
              type="button"
              onClick={() => void resendCode()}
              className="block w-full text-vog-brown/70 underline hover:text-vog-pattern"
            >
              Didn't get a code? Send another
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => goTo(mode === 'sign_in' ? 'sign_up' : 'sign_in')}
            className="block w-full text-vog-brown/70 underline hover:text-vog-pattern"
          >
            {mode === 'sign_in' ? 'New admin? Create an account' : 'Back to sign in'}
          </button>
        </div>
      </div>
    </PageShell>
  )
}
