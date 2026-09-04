import { Check, Clock, MapPin, MessageSquare, Share2, ShieldCheck } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { openConversation } from '../data/api'
import { useAuth } from '../data/AuthProvider'
import { useOrder, useOrderTimeline } from '../data/hooks'
import { Link } from 'react-router-dom'
import { PageBody, PageHeader } from '../layout/Page'
import CampusMap from '../components/CampusMap'
import { Avatar, Badge, Notice, Rating } from '../components/ui'

export default function TrackOrder() {
  // Reached as /orders/track?order=<id>; without one the fixture timeline shows.
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { profile, demo } = useAuth()
  const orderId = params.get('order') ?? undefined
  const { data: trackedOrder, loading } = useOrder(orderId)
  const { data: orderSteps } = useOrderTimeline(orderId)

  const shareOrder = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: 'CampusTrade order', url })
      } else {
        await navigator.clipboard.writeText(url)
      }
    } catch {
      // Dismissing the share sheet is a normal outcome.
    }
  }

  const messageSeller = async () => {
    if (demo || !profile || !trackedOrder) {
      navigate('/inbox')
      return
    }
    const id = await openConversation(profile.id, trackedOrder.seller.id)
    navigate(`/inbox/${id}`)
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Track Order" back wide />
        <PageBody wide>
          <div className="h-56 animate-pulse rounded-card bg-line/50" />
          <div className="mt-6 h-6 w-1/3 animate-pulse rounded bg-line/50" />
        </PageBody>
      </>
    )
  }

  if (!trackedOrder) {
    return (
      <>
        <PageHeader title="Track Order" back wide />
        <PageBody>
          <div className="card p-10 text-center">
            <h2 className="text-xl">Order not found</h2>
            <p className="mt-2 text-[15px] text-ink-soft">
              Open a tracking link from your orders to follow its progress.
            </p>
            <Link to="/orders" className="btn-primary mt-5">
              Go to Orders
            </Link>
          </div>
        </PageBody>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Track Order"
        back
        wide
        actions={
          <button
            onClick={() => void shareOrder()}
            aria-label="Share order"
            className="grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-surface-sunken"
          >
            <Share2 size={19} />
          </button>
        }
      />

      <PageBody wide>
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-8">
          <div>
            <div className="relative overflow-hidden rounded-card">
              <CampusMap className="aspect-[16/9] w-full lg:aspect-[2/1]" />
              <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-[130%] items-center gap-2 whitespace-nowrap rounded-full bg-surface px-4 py-2 text-sm font-bold text-ink shadow-pop">
                <ShieldCheck size={16} className="text-brand-500" />
                {trackedOrder.meetup_label}
              </span>
              <span className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-500 text-[rgb(var(--on-brand))] ring-4 ring-surface">
                <MapPin size={20} />
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                Meet-up Point
              </span>
              <span className="font-medium text-ink-soft">
                {trackedOrder.meetup_address}
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  trackedOrder.meetup_address,
                )}`}
                target="_blank"
                rel="noreferrer noopener"
                className="ml-auto text-sm font-bold text-brand-500"
              >
                Get Directions
              </a>
            </div>

            <div className="mt-9 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-xl font-bold lg:text-2xl">Order Status</h2>
              <span className="text-sm text-ink-muted">
                Order ID: {trackedOrder.reference}
              </span>
            </div>

            <ol className="mt-5">
              {orderSteps.map((step, i) => {
                const last = i === orderSteps.length - 1
                return (
                  <li key={step.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${
                          step.state === 'done'
                            ? 'border-brand-500 bg-brand-500 text-[rgb(var(--on-brand))]'
                            : step.state === 'current'
                              ? 'border-brand-500 text-brand-500'
                              : 'border-line text-line'
                        }`}
                      >
                        {step.state === 'done' ? (
                          <Check size={16} strokeWidth={3} />
                        ) : step.state === 'current' ? (
                          <Clock size={16} />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-line" />
                        )}
                      </span>
                      {!last && (
                        <span
                          className={`w-0.5 flex-1 ${
                            step.state === 'done' ? 'bg-brand-500' : 'bg-line'
                          }`}
                        />
                      )}
                    </div>

                    <div className={last ? 'pb-1' : 'pb-8'}>
                      <h3
                        className={`font-bold ${
                          step.state === 'current'
                            ? 'text-brand-600'
                            : step.state === 'upcoming'
                              ? 'text-ink-faint'
                              : 'text-ink'
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p
                        className={`mt-1 text-[15px] leading-relaxed ${
                          step.state === 'upcoming'
                            ? 'text-ink-faint'
                            : 'text-ink-soft'
                        }`}
                      >
                        {step.body}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>

          <aside className="mt-8 space-y-5 lg:sticky lg:top-28 lg:mt-0">
            <div className="card flex items-center gap-4 p-4">
              <Avatar
                src={trackedOrder.seller.avatar_url}
                alt={trackedOrder.seller.full_name}
                size={54}
                online
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold">{trackedOrder.seller.full_name}</h3>
                  <Badge tone="green">Verified</Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                  <Rating
                    value={trackedOrder.seller.rating}
                    count={trackedOrder.seller.review_count}
                  />
                  <span>·</span>
                  <span>Active 2m ago</span>
                </div>
              </div>
              <button
                onClick={() => void messageSeller()}
                aria-label="Message seller"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-500 text-[rgb(var(--on-brand))] transition hover:bg-brand-600"
              >
                <MessageSquare size={20} />
              </button>
            </div>

            <Notice title="Campus Safety Tip">
              Always complete transactions at verified campus locations for maximum
              safety. Avoid meeting after dark or in secluded areas.
            </Notice>
          </aside>
        </div>
      </PageBody>
    </>
  )
}
