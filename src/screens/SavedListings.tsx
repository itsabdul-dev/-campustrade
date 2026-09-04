import { Link } from 'react-router-dom'
import { Bookmark, MapPin } from 'lucide-react'
import { useSavedListings } from '../data/hooks'
import { PageBody, PageHeader } from '../layout/Page'
import { Img, Rating, moneyShort } from '../components/ui'

export default function SavedListings() {
  const { data: listings, loading } = useSavedListings()

  return (
    <>
      <PageHeader title="Saved Listings" back wide />

      <PageBody wide>
        {loading && (
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:gap-5 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-card bg-line/50" />
            ))}
          </div>
        )}

        {!loading && listings.length === 0 && (
          <div className="card p-10 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-sunken text-ink-faint">
              <Bookmark size={24} />
            </span>
            <h2 className="mt-4 text-xl">Nothing saved yet</h2>
            <p className="mt-2 text-[15px] text-ink-soft">
              Tap the bookmark on any listing to keep it here for later.
            </p>
            <Link to="/explore" className="btn-primary mt-5">
              Browse listings
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:gap-5 xl:grid-cols-4">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              to={`/listing/${listing.id}`}
              className="card group flex flex-col overflow-hidden transition hover:shadow-pop"
            >
              <div className="relative">
                <Img
                  src={listing.image_url}
                  alt={listing.title}
                  className="aspect-[4/3] w-full"
                />
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
                <div className="mt-3 border-t border-line pt-3">
                  <Rating value={listing.rating} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </PageBody>
    </>
  )
}
