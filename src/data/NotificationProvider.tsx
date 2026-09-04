import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { isSupabaseConfigured } from '../lib/supabase'
import { fetchNotifications, subscribeToNotifications } from './api'
import { useAuth } from './AuthProvider'
import type { AppNotification } from './types'

interface NotificationValue {
  items: AppNotification[]
  unread: number
  loading: boolean
  reload: () => void
  /** Latest arrival, for the transient toast. */
  toast: AppNotification | null
  dismissToast: () => void
  desktopPermission: NotificationPermission | 'unsupported'
  requestDesktop: () => Promise<void>
}

const NotificationContext = createContext<NotificationValue | null>(null)

const DEMO: AppNotification[] = [
  {
    id: 'n1',
    kind: 'order',
    title: 'New order received',
    body: 'Someone bought "Introduction to Psychology (11th Ed)".',
    link: '/orders',
    read: false,
    created_at: '2m ago',
  },
  {
    id: 'n2',
    kind: 'escrow',
    title: 'Escrow funds released',
    body: 'Payment for "Ergonomic Mesh Office Chair" has been released to you.',
    link: '/orders',
    read: false,
    created_at: '3h ago',
  },
]

const PERMISSION_KEY = 'campustrade.pref.desktopNotifications'

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { profile, demo } = useAuth()
  const [items, setItems] = useState<AppNotification[]>(demo ? DEMO : [])
  const [loading, setLoading] = useState(!demo)
  const [toast, setToast] = useState<AppNotification | null>(null)
  const [nonce, setNonce] = useState(0)

  const supported = typeof window !== 'undefined' && 'Notification' in window
  const [permission, setPermission] = useState<
    NotificationPermission | 'unsupported'
  >(supported ? Notification.permission : 'unsupported')

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setItems(DEMO)
      setLoading(false)
      return
    }
    if (!profile) return

    let cancelled = false
    setLoading(true)
    fetchNotifications(profile.id)
      .then((rows) => !cancelled && setItems(rows))
      .catch(() => !cancelled && setItems([]))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [profile, nonce])

  // Live delivery. Without this the bell only updated on a page load.
  useEffect(() => {
    if (!isSupabaseConfigured || !profile) return

    return subscribeToNotifications(profile.id, (notification) => {
      setItems((prev) => [notification, ...prev])
      setToast(notification)

      // A real background push needs a service worker and a push service; this
      // covers the case the tab is open but not focused.
      if (
        supported &&
        Notification.permission === 'granted' &&
        localStorage.getItem(PERMISSION_KEY) !== 'false' &&
        document.visibilityState === 'hidden'
      ) {
        try {
          new Notification(notification.title, { body: notification.body })
        } catch {
          // Some browsers only allow this from a service worker.
        }
      }
    })
  }, [profile, supported])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(timer)
  }, [toast])

  const requestDesktop = useCallback(async () => {
    if (!supported) return
    const result = await Notification.requestPermission()
    setPermission(result)
    localStorage.setItem(PERMISSION_KEY, String(result === 'granted'))
  }, [supported])

  const value = useMemo<NotificationValue>(
    () => ({
      items,
      unread: items.filter((n) => !n.read).length,
      loading,
      reload: () => setNonce((n) => n + 1),
      toast,
      dismissToast: () => setToast(null),
      desktopPermission: permission,
      requestDesktop,
    }),
    [items, loading, toast, permission, requestDesktop],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationCentre() {
  const value = useContext(NotificationContext)
  if (!value) {
    throw new Error('useNotificationCentre must be used inside NotificationProvider')
  }
  return value
}
