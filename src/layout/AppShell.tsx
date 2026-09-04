import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Compass,
  LayoutGrid,
  MessageSquare,
  PlusCircle,
  Settings,
  Users,
  Zap,
} from 'lucide-react'
import { useAuth } from '../data/AuthProvider'
import { useBadges } from '../data/hooks'
import NotificationToast from '../components/NotificationToast'
import { Avatar } from '../components/ui'

type Counts = { orders: number; inbox: number }

const navItems = (counts: Counts) => [
  { to: '/explore', label: 'Explore', icon: Compass, badge: 0 },
  { to: '/community', label: 'Community', icon: Users, badge: 0 },
  { to: '/sell', label: 'Sell', icon: PlusCircle, badge: 0 },
  { to: '/orders', label: 'Orders', icon: LayoutGrid, badge: counts.orders },
  { to: '/inbox', label: 'Inbox', icon: MessageSquare, badge: counts.inbox },
]

function Badge({ count }: { count: number }) {
  return (
    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-solid px-1 text-[10px] font-bold text-white">
      {count}
    </span>
  )
}

export function Brand({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`grid h-9 w-9 place-items-center rounded-[10px] ${
          inverted ? 'bg-white text-brand-600' : 'bg-ink text-white'
        }`}
      >
        <Zap size={18} className="fill-current" />
      </span>
      <span
        className={`text-xl font-bold tracking-[-.03em] ${
          inverted ? 'text-white' : 'text-ink'
        }`}
      >
        CampusTrade
      </span>
    </span>
  )
}

/**
 * One shell for both breakpoints: the tab bar the mobile designs use becomes a
 * persistent sidebar from `lg` up, and the content column widens rather than
 * stretching the phone layout.
 */
export default function AppShell() {
  const { pathname } = useLocation()
  const { profile } = useAuth()
  const { data: counts } = useBadges()
  const nav = navItems(counts)

  return (
    <div className="min-h-full lg:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-brand-500 focus:px-5 focus:py-3 focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <aside className="sticky top-8 hidden h-[calc(100vh-2rem)] w-[264px] shrink-0 flex-col border-r border-line bg-surface px-5 py-6 lg:flex">
        <NavLink to="/explore" className="px-2">
          <Brand />
        </NavLink>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-field px-3 py-2.5 text-[15px] font-semibold transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-ink-soft hover:bg-surface-sunken'
                }`
              }
            >
              <span className="relative">
                <Icon size={20} />
                {badge > 0 && <Badge count={badge} />}
              </span>
              {label}
            </NavLink>
          ))}

          <span className="my-3 h-px bg-line" />

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-field px-3 py-2.5 text-[15px] font-semibold transition ${
                isActive
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-ink-soft hover:bg-surface-sunken'
              }`
            }
          >
            <Settings size={20} />
            Settings
          </NavLink>
        </nav>

        <NavLink
          to="/account"
          className={`flex items-center gap-3 rounded-field p-2 transition hover:bg-surface-sunken ${
            pathname === '/account' ? 'bg-surface-sunken' : ''
          }`}
        >
          <Avatar
            src={profile?.avatar_url ?? ''}
            alt={profile?.full_name ?? 'Your profile'}
            size={40}
            online
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">
              {profile?.full_name ?? 'Account'}
            </span>
            <span className="block truncate text-xs text-ink-muted">
              {profile?.verified
                ? `Verified via ${profile.university}`
                : 'Not verified yet'}
            </span>
          </span>
        </NavLink>
      </aside>

      <main id="main" className="min-w-0 flex-1 pb-[76px] lg:pb-0">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-phone grid-cols-5">
          {nav.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  isActive ? 'text-brand-500' : 'text-ink-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon size={22} strokeWidth={isActive ? 2.4 : 1.9} />
                    {badge > 0 && <Badge count={badge} />}
                  </span>
                  <span className={isActive ? 'font-bold' : undefined}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <NotificationToast />
    </div>
  )
}
