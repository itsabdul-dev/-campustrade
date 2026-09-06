import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Mail,
  Store,
  User,
} from 'lucide-react'
import type { Role } from '../data/types'
import { useAuth } from '../data/AuthProvider'
import { Brand } from '../layout/AppShell'
import { Notice } from '../components/ui'

const roles: { key: Role; label: string; icon: typeof User }[] = [
  { key: 'student', label: 'Student', icon: GraduationCap },
  { key: 'faculty', label: 'Faculty', icon: User },
  { key: 'vendor', label: 'Vendor', icon: Store },
  { key: 'resident', label: 'Resident', icon: Building2 },
]

export default function SignUp() {
  const navigate = useNavigate()
  const { signUp, demo } = useAuth()
  const [role, setRole] = useState<Role>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [status, setStatus] = useState<'idle' | 'working' | 'confirm'>('idle')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()

    // Without a backend the form is a walkthrough, so it goes straight in.
    if (demo) {
      navigate('/explore')
      return
    }

    if (password.length < 8) {
      setError('Use at least 8 characters for your password.')
      return
    }

    setStatus('working')
    setError(null)
    try {
      const result = await signUp(email, role, password)
      if (result === 'session') {
        navigate('/explore')
        return
      }
      setStatus('confirm')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the account.')
      setStatus('idle')
    }
  }

  return (
    <main className="min-h-[100dvh] bg-surface lg:grid lg:grid-cols-2">
      {/* On mobile this is the purple header card; on desktop it becomes the
          left brand panel and stops scrolling away. */}
      <section className="rounded-b-[32px] bg-gradient-to-br from-brand-500 to-brand-400 px-6 pb-10 pt-8 text-white lg:sticky lg:top-8 lg:flex lg:h-[calc(100dvh-2rem)] lg:flex-col lg:justify-center lg:rounded-none lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Brand inverted />
          <h1 className="mt-8 text-[38px] leading-tight lg:text-5xl">
            Create Account
          </h1>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/85 lg:text-lg">
            Buy, sell and trade with the students around you.
          </p>
        </div>
      </section>

      <section className="px-6 pb-14 pt-6 lg:flex lg:items-center lg:px-16 lg:py-16">
        <form onSubmit={submit} className="mx-auto w-full max-w-md">
          <div className="grid grid-cols-2 gap-3">
            {roles.map(({ key, label, icon: Icon }) => {
              const active = role === key
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setRole(key)}
                  className={`relative rounded-card border p-4 text-left transition ${
                    active
                      ? 'border-accent-500 bg-accent-50/60 ring-4 ring-accent-500/10'
                      : 'border-line bg-surface hover:border-brand-200'
                  }`}
                >
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-full ${
                      active
                        ? 'bg-accent-500 text-white'
                        : 'bg-surface-sunken text-ink-soft'
                    }`}
                  >
                    <Icon size={20} />
                  </span>
                  <span
                    className={`mt-5 block font-bold ${
                      active ? 'text-accent-600' : 'text-ink'
                    }`}
                  >
                    {label}
                  </span>
                  <span
                    className={`absolute right-4 top-4 grid h-5 w-5 place-items-center rounded-full border-2 ${
                      active ? 'border-accent-500' : 'border-transparent'
                    }`}
                  >
                    {active && (
                      <span className="h-2.5 w-2.5 rounded-full bg-accent-500" />
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          <h2 className="mt-9 text-xl">Registration Details</h2>
          <p className="mt-1 text-[15px] text-ink-muted">
            Choose an email and a password. You are signed in straight away.
          </p>

          <label
            htmlFor="email"
            className="mt-6 block text-[15px] font-bold text-ink"
          >
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="field pl-11"
            />
          </div>

          <label
            htmlFor="password"
            className="mt-5 block text-[15px] font-bold text-ink"
          >
            Password
          </label>
          <div className="relative mt-2">
            <KeyRound
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              id="password"
              type={reveal ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
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

          {status === 'confirm' ? (
            <div className="mt-8">
              <Notice title="Confirm your email to continue" tone="blue">
                This project still has email confirmation switched on, so we sent
                a link to <strong>{email}</strong>. Open it and you are in.
              </Notice>
            </div>
          ) : (
            <button
              type="submit"
              disabled={status === 'working'}
              className="btn-primary mt-8 w-full py-4 text-base"
            >
              {status === 'working' ? 'Creating account...' : 'Create Account'}
              <ArrowRight size={18} />
            </button>
          )}

          {error && (
            <p role="alert" className="mt-3 text-center text-sm text-danger">
              {error}
            </p>
          )}

          <p className="mt-4 text-center text-[15px] text-ink-soft">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-accent-500">
              Log In
            </Link>
          </p>

          <p className="mt-8 text-center text-xs leading-relaxed text-ink-faint">
            By joining, you agree to CampusTrade's{' '}
            <Link to="/terms" className="underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline">
              Privacy Notice
            </Link>
            . This is a student project and no real payments are processed.
          </p>
        </form>
      </section>
    </main>
  )
}
