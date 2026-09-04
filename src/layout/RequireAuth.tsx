import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '../data/AuthProvider'

/**
 * Gates the in-app routes. With no Supabase credentials `demo` is true and the
 * gate is open, so the UI stays browsable before the backend is connected.
 */
export default function RequireAuth() {
  const { status, error, demo, retry } = useAuth()
  const location = useLocation()

  if (demo) return <Outlet />

  if (status === 'loading') {
    return (
      <div className="grid min-h-[100dvh] place-items-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand-500" />
      </div>
    )
  }

  // A valid session whose profile will not load is shown as an error. Silently
  // redirecting to /login here is what made a successful magic link look like
  // it had done nothing.
  if (status === 'error') {
    return (
      <div className="grid min-h-[100dvh] place-items-center px-6">
        <div className="card max-w-md p-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-danger-soft text-danger">
            <AlertTriangle size={22} />
          </span>
          <h1 className="mt-4 text-xl">We signed you in, but hit a snag</h1>
          <p className="mt-2 text-[15px] text-ink-soft">
            Your account is authenticated, but your profile could not be loaded.
          </p>
          {error && (
            <p className="mt-3 rounded-field bg-surface-sunken p-3 text-left font-mono text-xs text-ink-soft">
              {error}
            </p>
          )}
          <div className="mt-5 flex gap-3">
            <button onClick={retry} className="btn-primary flex-1 py-3">
              Try again
            </button>
            <Link to="/login" className="btn-ghost flex-1 py-3">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'signed_out') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
