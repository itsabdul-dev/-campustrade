import { CloudOff, RefreshCw } from 'lucide-react'

/**
 * Shown when a query fails. Without this a network failure is indistinguish-
 * able from genuinely having no data — "Nothing posted yet" is a lie when the
 * request never arrived, and campus wifi drops often enough to matter.
 */
export default function LoadError({
  error,
  onRetry,
  what = 'this',
}: {
  error: Error
  onRetry: () => void
  what?: string
}) {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine

  return (
    <div className="card p-8 text-center" role="alert">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-sunken text-ink-faint">
        <CloudOff size={24} />
      </span>
      <h2 className="mt-4 text-xl">
        {offline ? 'You are offline' : `Could not load ${what}`}
      </h2>
      <p className="mt-2 text-[15px] text-ink-soft">
        {offline
          ? 'Check your connection and try again.'
          : 'Something went wrong reaching the server.'}
      </p>
      <button onClick={onRetry} className="btn-primary mt-5">
        <RefreshCw size={16} /> Try again
      </button>
      <p className="mt-4 break-words font-mono text-xs text-ink-faint">
        {error.message}
      </p>
    </div>
  )
}
