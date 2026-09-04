import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Calendar,
  ChevronRight,
  Clock,
  Package,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useAuth } from '../data/AuthProvider'
import { useOrders, usePendingReviews } from '../data/hooks'
import { releaseEscrow } from '../data/api'
import type { Order } from '../data/types'
import LoadError from '../components/LoadError'
import ReviewSheet from '../components/ReviewSheet'
import StarRating from '../components/StarRating'
import type { PendingReview } from '../data/types'
import { Avatar, Badge, Img, Notice, money } from '../components/ui'

function StatusBadge({ status }: { status: Order['status'] }) {
  if (status === 'in_escrow')
    return (
      <Badge tone="amber" icon={<Clock size={12} />}>
        In Escrow
      </Badge>
    )
  if (status === 'in_transit')
    return (
      <Badge tone="blue" icon={<Package size={12} />}>
        In Transit
      </Badge>
    )
  return <Badge tone="green">Completed</Badge>
}

function ReleaseDialog({
  order,
  onClose,
  onConfirm,
}: {
  order: Order
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="release-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[22px] bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="release-title" className="text-xl">
            Item Received? Confirm Release
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-surface-sunken"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-4">
          <Notice icon={<ShieldCheck size={18} />}>
            Clicking confirm will release the escrow funds for{' '}
            <strong>{order.listing_title}</strong> to the vendor. This action
            cannot be undone.
          </Notice>
        </div>

        <button onClick={onConfirm} className="btn-primary mt-5 w-full py-4 text-base">
          Confirm &amp; Release Funds
        </button>
      </div>
    </div>
  )
}

export default function Orders() {
  const { profile, demo } = useAuth()
  const [tab, setTab] = useState<'buying' | 'selling' | 'past'>('buying')
  const [releasing, setReleasing] = useState<Order | null>(null)
  const { data: orders, loading, error, reload } = useOrders()
  const { data: pendingReviews, reload: reloadReviews } = usePendingReviews()
  const [reviewing, setReviewing] = useState<PendingReview | null>(null)

  const visible = orders.filter((o) =>
    tab === 'past' ? o.archived : !o.archived && o.role === tab,
  )

  const confirmRelease = async (order: Order) => {
    setReleasing(null)
    if (demo) return
    await releaseEscrow(order.id)
    reload()
    reloadReviews()
  }

  return (
    <>
      <header className="sticky top-8 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto max-w-shell px-4 py-3 lg:px-8 lg:py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold lg:text-2xl">Orders</h1>
            <div className="ml-auto flex items-center gap-2">
              <button
                aria-label="Notifications"
                className="relative grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-surface-sunken"
              >
                <Bell size={20} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger-solid" />
              </button>
              <Avatar
                src={profile?.avatar_url ?? ''}
                alt={profile?.full_name ?? 'Your profile'}
                size={38}
                online
              />
            </div>
          </div>

          <div className="mt-3 flex gap-1 rounded-full bg-surface-sunken p-1 lg:max-w-md">
            {(
              [
                ['buying', 'Buying'],
                ['selling', 'Selling'],
                ['past', 'Completed'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tab === key ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-shell px-4 py-5 lg:px-8 lg:py-8">
        {pendingReviews.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold">Rate your recent trades</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Reviews are how other students know who to trust.
            </p>
            <ul className="mt-3 space-y-2">
              {pendingReviews.map((pending) => (
                <li
                  key={pending.order_id}
                  className="card flex items-center gap-3 p-3"
                >
                  <Avatar
                    src={pending.subject_avatar}
                    alt={pending.subject_name}
                    size={44}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{pending.subject_name}</p>
                    <p className="truncate text-sm text-ink-muted">
                      {pending.listing_title}
                    </p>
                  </div>
                  <button
                    onClick={() => setReviewing(pending)}
                    className="btn-primary shrink-0 py-2.5 text-sm"
                  >
                    <StarRating value={0} size={14} /> Rate
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold lg:text-2xl">
            {tab === 'buying'
              ? 'Items You Are Buying'
              : tab === 'selling'
                ? 'Items You Are Selling'
                : 'Completed Orders'}
          </h2>
          <span className="rounded-full bg-surface-sunken px-3 py-1.5 text-sm font-semibold text-ink-soft">
            {visible.length} {visible.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        {loading && (
          <div className="mt-5 grid gap-4 lg:grid-cols-2 lg:gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-card bg-line/50" />
            ))}
          </div>
        )}

        {error && (
          <div className="mt-5">
            <LoadError error={error} onRetry={reload} what="your orders" />
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <p className="card mt-5 p-8 text-center text-ink-muted">
            {tab === 'buying'
              ? 'You have no purchases in progress.'
              : tab === 'selling'
                ? 'None of your listings have sold yet.'
                : 'No completed orders yet.'}
          </p>
        )}

        <div className="mt-5 grid gap-4 lg:grid-cols-2 lg:gap-6">
          {visible.map((order) => (
            <article key={order.id} className="card p-4 lg:p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.12em] text-ink-muted">
                  <Calendar size={14} />
                  {order.placed_on}
                </span>
                <StatusBadge status={order.status} />
              </div>

              <div className="mt-4 flex gap-4">
                <Img
                  src={order.image_url}
                  alt={order.listing_title}
                  className="h-20 w-20 shrink-0 rounded-field"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 font-bold leading-snug">
                    {order.listing_title}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    {order.role === 'selling' ? 'Buyer' : 'Seller'}:{' '}
                    {order.counterparty} · {order.reference}
                  </p>
                  <p className="mt-2 text-xl font-extrabold text-brand-600">
                    {money(order.amount)}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-line pt-4">
                {/* Any order that has not completed is still open, whatever
                    stage it is at. Gating the release button on `in_escrow`
                    alone left in_transit and ready_for_pickup orders with no
                    way to ever be completed. */}
                {order.archived ? (
                  <Link
                    to={`/orders/track?order=${order.id}`}
                    className="btn w-full bg-surface-sunken py-3.5 text-ink hover:bg-line"
                  >
                    View Tracking Details <ChevronRight size={17} />
                  </Link>
                ) : (
                  <>
                    {order.role === 'buying' ? (
                      <button
                        onClick={() => setReleasing(order)}
                        className="btn-primary w-full py-3.5"
                      >
                        <ShieldCheck size={17} /> Confirm Receipt &amp; Release
                        Funds
                      </button>
                    ) : (
                      <p className="py-1 text-center text-sm text-ink-muted">
                        Waiting for the buyer to confirm receipt.
                      </p>
                    )}

                    <Link
                      to={`/orders/track?order=${order.id}`}
                      className="btn w-full bg-surface-sunken py-3 text-sm text-ink hover:bg-line"
                    >
                      View Tracking Details <ChevronRight size={16} />
                    </Link>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>

        {tab === 'buying' && (
          <div className="mt-6 lg:max-w-2xl">
            <Notice title="Simulated escrow">
              In a live version your funds would be held until you confirm
              delivery. This is a student project — no money is held, and you
              settle directly with the other student.
            </Notice>
          </div>
        )}
      </div>

      <ReviewSheet
        pending={reviewing}
        onClose={() => setReviewing(null)}
        onDone={reloadReviews}
      />

      {releasing && (
        <ReleaseDialog
          order={releasing}
          onClose={() => setReleasing(null)}
          onConfirm={() => void confirmRelease(releasing)}
        />
      )}
    </>
  )
}
