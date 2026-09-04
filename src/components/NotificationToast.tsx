import { Link } from 'react-router-dom'
import { Bell, HandCoins, MessageSquare, Package, ShieldCheck, X } from 'lucide-react'
import { useNotificationCentre } from '../data/NotificationProvider'

const icons: Record<string, typeof Bell> = {
  order: Package,
  escrow: ShieldCheck,
  message: MessageSquare,
  offer: HandCoins,
}

/** Transient banner for a notification that arrived while you are looking. */
export default function NotificationToast() {
  const { toast, dismissToast } = useNotificationCentre()
  if (!toast) return null

  const Icon = icons[toast.kind] ?? Bell
  const body = (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-500">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{toast.title}</span>
        <span className="mt-0.5 block truncate text-sm text-ink-soft">
          {toast.body}
        </span>
      </span>
    </>
  )

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-[96px] z-[60] mx-auto max-w-sm animate-[fadeIn_.2s_ease-out] lg:bottom-6 lg:left-auto lg:right-6 lg:mx-0"
    >
      <div className="card flex items-center gap-3 p-3 shadow-pop">
        {toast.link ? (
          <Link
            to={toast.link}
            onClick={dismissToast}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            {body}
          </Link>
        ) : (
          <span className="flex min-w-0 flex-1 items-center gap-3">{body}</span>
        )}
        <button
          onClick={dismissToast}
          aria-label="Dismiss notification"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-faint transition hover:bg-surface-sunken"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
