import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, MessageSquare, Package, ShieldCheck } from 'lucide-react'
import { markNotificationsRead } from '../data/api'
import { useAuth } from '../data/AuthProvider'
import { useNotificationCentre } from '../data/NotificationProvider'
import Sheet from './Sheet'

const icons: Record<string, typeof Bell> = {
  order: Package,
  escrow: ShieldCheck,
  message: MessageSquare,
}

export default function NotificationsPanel({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { profile, demo } = useAuth()
  const {
    items: notifications,
    unread,
    loading,
    reload,
    desktopPermission,
    requestDesktop,
  } = useNotificationCentre()

  // Opening the panel is the read receipt.
  useEffect(() => {
    if (!open || demo || !profile || unread === 0) return
    void markNotificationsRead(profile.id).then(reload)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Sheet open={open} onClose={onClose} title="Notifications">
      {desktopPermission === 'default' && (
        <button
          onClick={() => void requestDesktop()}
          className="mb-4 flex w-full items-center gap-3 rounded-field bg-brand-50 p-3 text-left text-brand-600 transition hover:bg-brand-100"
        >
          <Bell size={18} className="shrink-0" />
          <span className="text-sm font-semibold">
            Turn on desktop alerts so you do not miss a buyer.
          </span>
        </button>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-field bg-line/50" />
          ))}
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="py-10 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface-sunken text-ink-faint">
            <Bell size={22} />
          </span>
          <p className="mt-3 text-[15px] text-ink-muted">You are all caught up.</p>
        </div>
      )}

      <ul className="space-y-2">
        {notifications.map((n) => {
          const Icon = icons[n.kind] ?? Bell
          const body = (
            <>
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                  n.read ? 'bg-surface-sunken text-ink-faint' : 'bg-brand-50 text-brand-500'
                }`}
              >
                <Icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-bold">{n.title}</span>
                  {!n.read && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                  )}
                </span>
                <span className="mt-0.5 block text-sm text-ink-soft">{n.body}</span>
                <span className="mt-1 block text-xs text-ink-faint">
                  {n.created_at}
                </span>
              </span>
            </>
          )

          return (
            <li key={n.id}>
              {n.link ? (
                <Link
                  to={n.link}
                  onClick={onClose}
                  className="flex gap-3 rounded-field p-3 transition hover:bg-surface-sunken"
                >
                  {body}
                </Link>
              ) : (
                <div className="flex gap-3 rounded-field p-3">{body}</div>
              )}
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
