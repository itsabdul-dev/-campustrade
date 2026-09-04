import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, KeyRound, Mail } from 'lucide-react'
import { useAuth } from '../data/AuthProvider'
import { Brand } from '../layout/AppShell'
import { Notice } from '../components/ui'

type Mode = 'link' | 'password'

export default function LogIn() {
  const navigate = useNavigate()
  const {
    signIn,
    signInWithPassword,
    resetPassword,
    demo,
    error: authError,
  } = useAuth()

  const [mode, setMode] = useState<Mode>('link')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [status, setStatus] = useState<'idle' | 'busy' | 'sent' | 'reset'>('idle')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()

    if (demo) {
      navigate('/explore')
      return
    }

    setStatus('busy')
    setError(null)
    try {
      if (mode === 'password') {
        await signInWithPassword(email, password)
        navigate('/explore')
        return
      }
      await signIn(email)
      setStatus('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign you in.')
      setStatus('idle')
    }
  }

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
    <main className="grid min-h-screen place-items-center bg-surface px-6 py-12">
      <div className="w-full max-w-md">
        <Brand />

        <h1 className="mt-8 text-[34px] leading-tight lg:text-4xl">Welcome back</h1>
        <p className="mt-2 text-[15px] text-ink-soft">
          Sign in with the university email you registered with.
        </p>

        {authError && (
          <div className="mt-6">
            <Notice title="That sign-in link did not work" tone="blue">
              {authError}
            </Notice>
          </div>
        )}

        <div className="mt-7 flex gap-1 rounded-full bg-surface-sunken p-1">
          {(
            [
              ['link', 'Email link'],
              ['password', 'Password'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setMode(key)
                setStatus('idle')
                setError(null)
              }}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === key ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => void submit(e)} className="mt-6">
          <label htmlFor="email" className="block text-[15px] font-bold">
            University Email
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
              placeholder="yourname@mycput.ac.za"
              className="field pl-11"
            />
          </div>

          {mode === 'password' && (
            <div className="mt-5">
              <div className="flex items-baseline justify-between">
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
          )}

          {status === 'sent' ? (
            <div className="mt-6">
              <Notice title="Check your inbox">
                We sent a secure sign-in link to <strong>{email}</strong>.
              </Notice>
            </div>
          ) : status === 'reset' ? (
            <div className="mt-6">
              <Notice title="Reset link sent">
                Open the link in <strong>{email}</strong> to choose a new password.
              </Notice>
            </div>
          ) : (
            <button
              type="submit"
              disabled={status === 'busy'}
              className="btn-primary mt-6 w-full py-4 text-base"
            >
              {status === 'busy'
                ? 'Working...'
                : mode === 'password'
                  ? 'Sign In'
                  : 'Send Sign-In Link'}
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
