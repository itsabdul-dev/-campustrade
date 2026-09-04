import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Bookmark,
  Check,
  Flag,
  MapPin,
  MessageSquare,
  ShieldCheck,
  ShoppingCart,
} from 'lucide-react'
import { openConversation, toggleSaved } from '../data/api'
import { useAuth } from '../data/AuthProvider'
import { useCart } from '../data/CartProvider'
import { useListing } from '../data/hooks'
import type { Condition } from '../data/types'
import ReportBlock from '../components/ReportBlock'
import { PageBody, PageHeader } from '../layout/Page'
import { Avatar, Badge, Img, Notice, Rating, money } from '../components/ui'

const conditionLabel: Record<Condition, string> = {
  new: 'New',
  like_new: 'Like New',
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
}

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile, demo } = useAuth()
  const cart = useCart()
  const { data: listing, loading, error } = useListing(id)

  const [active, setActive] = useState(0)
  const [saved, setSaved] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  const save = () => {
    if (!listing) return
    const next = !(saved ?? listing.saved)
    setSaved(next)
    if (!demo && profile) {
      void toggleSaved(listing.id, profile.id, next).catch(() => setSaved(!next))
    }
  }

  const message = async () => {
    if (!listing) return
    if (demo || !profile) {
      navigate('/inbox')
      return
    }
    setBusy(true)
    try {
      const conversationId = await openConversation(
        profile.id,
        listing.seller_id,
        listing.id,
      )
      navigate(`/inbox/${conversationId}`)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Listing" back />
        <PageBody>
          <div className="h-72 animate-pulse rounded-card bg-line/50" />
          <div className="mt-5 h-8 w-2/3 animate-pulse rounded bg-line/50" />
          <div className="mt-3 h-5 w-1/3 animate-pulse rounded bg-line/40" />
        </PageBody>
      </>
    )
  }

  if (!listing) {
    return (
      <>
        <PageHeader title="Listing" back />
        <PageBody>
          <div className="card p-10 text-center">
            <h2 className="text-xl">This listing is not available</h2>
            <p className="mt-2 text-[15px] text-ink-soft">
              It may have been sold or withdrawn by the seller.
            </p>
            {error && (
              <p className="mt-3 rounded-field bg-surface-sunken p-3 text-left font-mono text-xs text-ink-soft">
                {error.message}
              </p>
            )}
            <Link to="/explore" className="btn-primary mt-5">
              Back to Explore
            </Link>
          </div>
        </PageBody>
      </>
    )
  }

  const isSaved = saved ?? listing.saved
  const inCart = cart.has(listing.id)
  const isOwn = profile?.id === listing.seller_id
  const images =
    listing.image_urls.length > 0 ? listing.image_urls : [listing.image_url]

  return (
    <>
      <PageHeader
        title="Listing"
        back
        wide
        actions={
          <button
            onClick={save}
            aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
            aria-pressed={isSaved}
            className={`grid h-9 w-9 place-items-center rounded-full transition ${
              isSaved ? 'text-brand-500' : 'text-ink hover:bg-surface-sunken'
            }`}
          >
            <Bookmark size={20} className={isSaved ? 'fill-brand-500' : undefined} />
          </button>
        }
      />

      <PageBody wide>
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-10">
          <div>
            <Img
              src={images[active]}
              alt={listing.title}
              className="aspect-[4/3] w-full rounded-card"
            />

            {images.length > 1 && (
              <div className="mt-3 flex gap-3">
                {images.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setActive(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`overflow-hidden rounded-field ring-2 transition ${
                      i === active ? 'ring-brand-500' : 'ring-transparent'
                    }`}
                  >
                    <Img src={src} alt="" className="h-16 w-16" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 hidden lg:block">
              <h2 className="text-lg font-bold">Description</h2>
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">
                {listing.description || 'The seller has not added a description.'}
              </p>
            </div>
          </div>

          <div className="mt-6 lg:mt-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">{conditionLabel[listing.condition]}</Badge>
              <Badge>{listing.category}</Badge>
            </div>

            <h1 className="mt-3 text-[26px] leading-tight lg:text-3xl">
              {listing.title}
            </h1>
            <p className="mt-2 text-3xl font-extrabold text-brand-600">
              {money(listing.price)}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-muted">
              <span className="flex items-center gap-1.5">
                <MapPin size={15} /> {listing.location}
              </span>
              <Rating value={listing.rating} />
            </div>

            <div className="mt-5 lg:hidden">
              <h2 className="text-lg font-bold">Description</h2>
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">
                {listing.description || 'The seller has not added a description.'}
              </p>
            </div>

            <Link
              to="/account"
              className="card mt-6 flex items-center gap-3 p-4 transition hover:shadow-pop"
            >
              <Avatar
                src={listing.seller.avatar_url}
                alt={listing.seller.full_name}
                size={46}
                online={listing.seller.online}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-bold">
                    {listing.seller.full_name}
                  </span>
                  {listing.seller.verified && <Badge tone="green">Verified</Badge>}
                </span>
                <span className="mt-1 block text-sm text-ink-muted">
                  <Rating
                    value={listing.seller.rating}
                    count={listing.seller.review_count}
                  />
                </span>
              </span>
            </Link>

            {isOwn ? (
              <div className="mt-6">
                <Notice title="This is your listing">
                  Manage it from your active listings.
                </Notice>
                <Link to="/account/listings" className="btn-ghost mt-3 w-full py-3.5">
                  My Active Listings
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    if (!inCart) cart.add(listing, listing.seller.full_name)
                    navigate('/checkout')
                  }}
                  className="btn-primary w-full py-4 text-base"
                >
                  <ShieldCheck size={18} /> Buy with Escrow
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      inCart
                        ? cart.remove(listing.id)
                        : cart.add(listing, listing.seller.full_name)
                    }
                    className="btn-ghost flex-1 py-3.5"
                  >
                    {inCart ? (
                      <>
                        <Check size={17} /> In Basket
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={17} /> Add to Basket
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => void message()}
                    disabled={busy}
                    className="btn-ghost flex-1 py-3.5"
                  >
                    <MessageSquare size={17} /> Message
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6">
              <Notice title="Meet safely">
                Arrange handovers at a verified campus safe zone in daylight.
                Payment is simulated in this project, so you settle directly with
                the seller.
              </Notice>
            </div>

            {!isOwn && (
              <button
                onClick={() => setReportOpen(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 py-2 text-sm font-semibold text-ink-muted transition hover:text-danger"
              >
                <Flag size={15} /> Report this listing
              </button>
            )}
          </div>
        </div>
      </PageBody>

      <ReportBlock
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        subjectKind="listing"
        subjectId={listing.id}
        subjectName={listing.seller.full_name}
        blockable
      />
    </>
  )
}
