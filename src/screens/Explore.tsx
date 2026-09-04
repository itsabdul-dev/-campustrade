import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Bell,
  Book,
  Laptop,
  MapPin,
  Megaphone,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sofa,
  Wrench,
} from 'lucide-react'
import { useAuth } from '../data/AuthProvider'
import { useCart } from '../data/CartProvider'
import { useBadges, useListings } from '../data/hooks'
import { useDebounced } from '../components/useDebounced'
import FilterSheet from '../components/FilterSheet'
import LoadError from '../components/LoadError'
import NotificationsPanel from '../components/NotificationsPanel'
import { useNotificationCentre } from '../data/NotificationProvider'
import type { Condition, Listing, ListingCategory } from '../data/types'
import {
  Avatar,
  Badge,
  Img,
  Rating,
  SectionTitle,
  moneyShort,
} from '../components/ui'

const categories: { key: ListingCategory | 'all'; label: string; icon: typeof Book }[] =
  [
    { key: 'textbooks', label: 'Textbooks', icon: Book },
    { key: 'electronics', label: 'Electronics', icon: Laptop },
    { key: 'services', label: 'Services', icon: Wrench },
    { key: 'furniture', label: 'Home', icon: Sofa },
  ]

const conditionLabel: Record<Condition, string> = {
  new: 'New',
  like_new: 'Like New',
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
}

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      to={`/listing/${listing.id}`}
      className="card group flex flex-col overflow-hidden transition hover:shadow-pop"
    >
      <div className="relative">
        <Img
          src={listing.image_url}
          alt={listing.title}
          className="aspect-[4/3] w-full"
        />
        <span className="absolute left-3 top-3 rounded-full bg-surface/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink shadow-sm">
          {conditionLabel[listing.condition]}
        </span>
        <span className="absolute bottom-3 left-3 text-xl font-extrabold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,.6)]">
          {moneyShort(listing.price)}
        </span>
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug">
          {listing.title}
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">{listing.location}</span>
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <Rating value={listing.rating} />
          <ArrowUpRight
            size={16}
            className="text-brand-500 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </div>
      </div>
    </Link>
  )
}

export default function Explore() {
  const { profile } = useAuth()
  const [category, setCategory] = useState<ListingCategory | 'all'>('all')
  const [query, setQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const cart = useCart()
  const { data: counts } = useBadges()
  const { unread: bellCount } = useNotificationCentre()
  const [condition, setCondition] = useState<Condition | 'any'>('any')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState<'recent' | 'price_asc' | 'price_desc' | 'rating'>(
    'recent',
  )
  // Search now runs in Postgres, so the input is debounced rather than
  // filtering a page of rows already in memory.
  const debouncedQuery = useDebounced(query, 300)
  const { data: listings, loading, error, reload } = useListings(
    category,
    debouncedQuery,
  )

  const activeFilterCount =
    (condition === 'any' ? 0 : 1) + (maxPrice ? 1 : 0) + (sort === 'recent' ? 0 : 1)

  // Category filtering happens in the query; search, refinement and sorting are
  // client-side so the grid responds without a round trip.
  const visible = useMemo(() => {
    const ceiling = maxPrice ? Number(maxPrice) : Infinity
    const rows = listings.filter(
      (l) => (condition === 'any' || l.condition === condition) && l.price <= ceiling,
    )

    const sorted = [...rows]
    if (sort === 'price_asc') sorted.sort((a, b) => a.price - b.price)
    if (sort === 'price_desc') sorted.sort((a, b) => b.price - a.price)
    if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating)
    return sorted
  }, [listings, condition, maxPrice, sort])

  return (
    <>
      <header className="sticky top-8 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto max-w-shell px-4 py-3 lg:px-8 lg:py-4">
          <h1 className="sr-only">Explore the campus marketplace</h1>
          <div className="flex items-center gap-3">
            <Link to="/explore" className="flex items-center gap-2 lg:hidden">
              <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-brand-500 text-[rgb(var(--on-brand))]">
                <Megaphone size={16} />
              </span>
              <span className="text-lg font-bold tracking-[-.03em] text-brand-600">
                CampusTrade
              </span>
            </Link>

            <div className="relative hidden flex-1 lg:block">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search campus marketplace..."
                aria-label="Search the campus marketplace"
                className="field rounded-full bg-surface-sunken pl-11"
              />
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => setFiltersOpen(true)}
                aria-label="Filters"
                className="relative hidden h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-surface-sunken lg:grid"
              >
                <SlidersHorizontal size={19} />
                {activeFilterCount > 0 && (
                  <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <Link
                to="/checkout"
                aria-label="Basket"
                className="relative grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-surface-sunken"
              >
                <ShoppingCart size={20} />
                {cart.count > 0 && (
                  <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-[rgb(var(--on-brand))]">
                    {cart.count}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setNotificationsOpen(true)}
                aria-label="Notifications"
                className="relative grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-surface-sunken"
              >
                <Bell size={20} />
                {bellCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-danger-solid text-[10px] font-bold text-white">
                    {bellCount}
                  </span>
                )}
              </button>
              <Link to="/account" aria-label="Your account">
                <Avatar
                  src={profile?.avatar_url ?? ''}
                  alt={profile?.full_name ?? 'Your profile'}
                  size={38}
                  online
                />
              </Link>
            </div>
          </div>

          <div className="relative mt-3 flex gap-2 lg:hidden">
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search campus marketplace..."
                aria-label="Search the campus marketplace"
                className="field rounded-full bg-surface-sunken pl-11"
              />
            </div>
            <button
              onClick={() => setFiltersOpen(true)}
              aria-label="Filters"
              className="relative grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full bg-surface-sunken text-ink-soft"
            >
              <SlidersHorizontal size={18} />
              {activeFilterCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-shell px-4 py-5 lg:px-8 lg:py-8">
        <div className="hide-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {categories.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setCategory(category === key ? 'all' : key)}
              className={`chip ${category === key ? 'chip-active' : ''}`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-8">
          <div>
            <div className="rounded-card bg-gradient-to-br from-brand-50 to-accent-50 p-5 lg:p-7">
              <h2 className="text-2xl lg:text-3xl">
                Hello, {profile?.full_name.split(' ')[0] ?? 'there'}! 👋
              </h2>
              <p className="mt-1.5 text-[15px] text-ink-soft">
                {counts.orders > 0
                  ? `You have ${counts.orders} ${
                      counts.orders === 1 ? 'order' : 'orders'
                    } in progress${
                      counts.inbox > 0
                        ? ` and ${counts.inbox} unread ${
                            counts.inbox === 1 ? 'chat' : 'chats'
                          }`
                        : ''
                    }.`
                  : 'Find what you need from students on your campus.'}
              </p>
              <Link
                to={counts.orders > 0 ? '/orders' : '/sell'}
                className="btn-primary mt-4"
              >
                {counts.orders > 0 ? 'View My Orders' : 'Sell an Item'}
              </Link>
            </div>

            <div className="mt-8">
              <SectionTitle
                action={
                  <span className="text-sm font-semibold text-ink-muted">
                    {visible.length} {visible.length === 1 ? 'result' : 'results'}
                  </span>
                }
              >
                Featured Listings
              </SectionTitle>

              {error ? (
                <LoadError error={error} onRetry={reload} what="listings" />
              ) : loading ? (
                <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:gap-5 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-64 animate-pulse rounded-card bg-line/50"
                    />
                  ))}
                </div>
              ) : visible.length === 0 ? (
                <div className="card p-8 text-center">
                  <p className="font-bold">No listings match</p>
                  <p className="mt-1 text-[15px] text-ink-muted">
                    {query
                      ? `Nothing found for "${query}". Try a different word, or clear your filters.`
                      : 'Try clearing your filters.'}
                  </p>
                  {(query || activeFilterCount > 0) && (
                    <button
                      onClick={() => {
                        setQuery('')
                        setCondition('any')
                        setMaxPrice('')
                        setSort('recent')
                      }}
                      className="btn-ghost mt-4"
                    >
                      Clear search and filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:gap-5 xl:grid-cols-4">
                  {visible.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bulletin board: inline card on mobile, a rail on desktop. */}
          <aside className="mt-8 lg:sticky lg:top-32 lg:mt-0">
            <Link
              to="/community"
              className="flex items-center gap-4 rounded-card bg-gradient-to-br from-positive-soft to-positive-soft p-5 transition hover:shadow-card"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-positive-solid text-white">
                <Megaphone size={22} />
              </span>
              <span>
                <span className="block font-bold">Bulletin Board</span>
                <span className="mt-0.5 block text-sm text-ink-soft">
                  See what's happening on campus this week.
                </span>
              </span>
            </Link>

            <div className="mt-5 hidden card p-5 lg:block">
              <h3 className="font-bold">Trading safely</h3>
              <ul className="mt-3 space-y-3 text-sm text-ink-soft">
                <li className="flex gap-3">
                  <Badge tone="brand">1</Badge>
                  Meet only at verified campus safe zones.
                </li>
                <li className="flex gap-3">
                  <Badge tone="brand">2</Badge>
                  Keep payment in escrow until you inspect the item.
                </li>
                <li className="flex gap-3">
                  <Badge tone="brand">3</Badge>
                  Check the seller's rating and review count first.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        condition={condition}
        setCondition={setCondition}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        sort={sort}
        setSort={setSort}
      />

      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </>
  )
}
