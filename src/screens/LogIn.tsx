import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, KeyRound, Mail } from 'lucide-react'
import { useAuth } from '../data/AuthProvider'
import { Brand } from '../layout/AppShell'
import { Notice } from '../components/ui'

export default function LogIn() {
  const navigate = useNavigate()
  const { signInWithPassword, resetPassword, demo, error: authError } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [status, setStatus] = useState<'idle' | 'working' | 'reset'>('idle')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()

    if (demo) {
      navigate('/explore')
      return
    }

    setStatus('working')
    setError(null)
    try {
      await signInWithPassword(email, password)
      navigate('/explore')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign you in.')
      setStatus('idle')
    }
  }

  // The only path that still sends mail, and only when someone asks for it.
  const forgot = async () => {
    if (!email) {
      setError('Enter your email first, then choose Forgot password.')
      return
    }
    setError(null)
    try {
      await resetPassword(email)
      setStatus('reset')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the reset link.')
    }
  }

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-surface px-6 py-12">
      <div className="w-full max-w-md">
        <Brand />

        <h1 className="mt-8 text-[34px] leading-tight lg:text-4xl">Welcome back</h1>
        <p className="mt-2 text-[15px] text-ink-soft">
          Sign in with your email and password.
        </p>

        {authError && (
          <div className="mt-6">
            <Notice title="That sign-in did not work" tone="blue">
              {authError}
            </Notice>
          </div>
        )}

        <form onSubmit={(e) => void submit(e)} className="mt-7">
          <label htmlFor="email" className="block text-[15px] font-bold">
            Email address
          </label>
          <div className="relative mt-2">
            <Mail
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="field pl-11"
            />
          </div>

          <div className="mt-5">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="password" className="block text-[15px] font-bold">
                Password
              </label>
              <button
                type="button"
                onClick={() => void forgot()}
                className="text-sm font-semibold text-brand-500"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative mt-2">
              <KeyRound
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <input
                id="password"
                type={reveal ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="field px-11"
              />
              <button
                type="button"
                onClick={() => setReveal(!reveal)}
                aria-label={reveal ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-ink-faint transition hover:bg-surface-sunken"
              >
                {reveal ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {status === 'reset' ? (
            <div className="mt-6">
              <Notice title="Reset link sent">
                Open the link in <strong>{email}</strong> to choose a new password.
              </Notice>
            </div>
          ) : (
            <button
              type="submit"
              disabled={status === 'working'}
              className="btn-primary mt-6 w-full py-4 text-base"
            >
              {status === 'working' ? 'Signing in...' : 'Sign In'}
              <ArrowRight size={18} />
            </button>
          )}

          {error && (
            <p role="alert" className="mt-3 text-center text-sm text-danger">
              {error}
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-[15px] text-ink-soft">
          New here?{' '}
          <Link to="/signup" className="font-bold text-accent-500">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  )
}
