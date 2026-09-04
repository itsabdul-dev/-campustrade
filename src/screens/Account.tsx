import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bookmark,
  ChevronRight,
  CreditCard,
  Pencil,
  History,
  LogOut,
  Settings,
  ShieldCheck,
  Store,
} from 'lucide-react'
import { useAuth } from '../data/AuthProvider'
import { useReviews } from '../data/hooks'
import EditProfile from '../components/EditProfile'
import StarRating from '../components/StarRating'
import { Avatar, Badge } from '../components/ui'

const menu = [
  {
    to: '/account/listings',
    label: 'My Active Listings',
    icon: Store,
    tone: 'bg-danger-soft text-danger',
  },
  {
    to: '/account/saved',
    label: 'Saved Listings',
    icon: Bookmark,
    tone: 'bg-warning-soft text-warning',
  },
  {
    to: '/orders',
    label: 'Order & Purchase History',
    icon: History,
    tone: 'bg-positive-soft text-positive',
  },
  {
    to: '/settings',
    label: 'Linked Payment (PayFast/SnapScan)',
    icon: CreditCard,
    tone: 'bg-brand-50 text-brand-500',
  },
  {
    to: '/settings',
    label: 'Security Settings (2FA)',
    icon: ShieldCheck,
    tone: 'bg-accent-50 text-accent-500',
  },
]

export default function Account() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const [editing, setEditing] = useState(false)
  const { data: reviews, loading: reviewsLoading } = useReviews(profile?.id)

  const logOut = async () => {
    await signOut()
    navigate('/')
  }

  if (!profile) return null

  return (
    <>
      <header className="sticky top-8 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 lg:px-8 lg:py-4">
          <h1 className="text-xl font-bold lg:text-2xl">Account</h1>
          <Link
            to="/settings"
            aria-label="Settings"
            className="ml-auto grid h-10 w-10 place-items-center rounded-full bg-surface-sunken text-ink-soft transition hover:bg-line"
          >
            <Settings size={19} />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
        <div className="flex flex-col items-center text-center lg:flex-row lg:gap-6 lg:text-left">
          <Avatar
            src={profile.avatar_url}
            alt={profile.full_name}
            size={112}
            online
            ring
          />
          <div className="mt-4 lg:mt-0">
            <h2 className="text-3xl lg:text-4xl">{profile.full_name}</h2>
            <div className="mt-2 flex justify-center lg:justify-start">
              <Badge tone="brand" icon={<ShieldCheck size={13} />}>
                {profile.role} · Verified via {profile.university}
              </Badge>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="btn-ghost mt-3 py-2 text-sm"
            >
              <Pencil size={15} /> Edit profile
            </button>
            <div className="mt-3 flex items-center justify-center gap-2 lg:justify-start">
              <StarRating value={Math.round(profile.rating)} size={17} />
              <span className="text-sm text-ink-muted">
                {profile.review_count > 0
                  ? `${profile.rating.toFixed(1)} · ${profile.review_count} ${
                      profile.review_count === 1 ? 'review' : 'reviews'
                    }`
                  : 'No reviews yet'}
              </span>
            </div>
          </div>
        </div>

        <nav className="card mt-8 divide-y divide-line">
          {menu.map(({ to, label, icon: Icon, tone }) => (
            <Link
              key={label}
              to={to}
              className="flex items-center gap-4 px-4 py-4 transition first:rounded-t-card last:rounded-b-card hover:bg-surface-sunken lg:px-5"
            >
              <span className={`grid h-11 w-11 place-items-center rounded-full ${tone}`}>
                <Icon size={20} />
              </span>
              <span className="flex-1 font-bold">{label}</span>
              <ChevronRight size={20} className="text-ink-faint" />
            </Link>
          ))}
        </nav>

        <section className="mt-10">
          <h2 className="text-xl font-bold">Reviews</h2>

          {reviewsLoading && (
            <div className="mt-3 space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-card bg-line/50" />
              ))}
            </div>
          )}

          {!reviewsLoading && reviews.length === 0 && (
            <p className="card mt-3 p-6 text-center text-[15px] text-ink-muted">
              No reviews yet. They appear here once you complete a trade.
            </p>
          )}

          <ul className="mt-3 space-y-3">
            {reviews.map((review) => (
              <li key={review.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={review.reviewer_avatar}
                    alt={review.reviewer}
                    size={38}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{review.reviewer}</p>
                    <p className="text-xs text-ink-faint">{review.created_at}</p>
                  </div>
                  <StarRating value={review.rating} size={15} />
                </div>
                {review.body && (
                  <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                    {review.body}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>

        <button
          onClick={() => void logOut()}
          className="btn mt-8 w-full border border-danger/30 bg-danger-soft py-4 text-base text-danger hover:bg-danger-softer lg:w-auto lg:px-10"
        >
          <LogOut size={18} /> Log Out
        </button>

        <p className="mt-6 text-center text-[11px] font-bold uppercase tracking-[.14em] text-ink-faint lg:text-left">
          CampusTrade v2.4.1 (Stable)
        </p>
      </div>

      <EditProfile open={editing} onClose={() => setEditing(false)} />
    </>
  )
}
