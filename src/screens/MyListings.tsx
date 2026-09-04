import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Trash2 } from 'lucide-react'
import { withdrawListing } from '../data/api'
import { useAuth } from '../data/AuthProvider'
import { useMyListings } from '../data/hooks'
import { PageBody, PageHeader } from '../layout/Page'
import { Badge, Img, moneyShort } from '../components/ui'

export default function MyListings() {
  const { demo } = useAuth()
  const { data: listings, loading, reload } = useMyListings()
  const [removing, setRemoving] = useState<string | null>(null)

  const withdraw = async (id: string) => {
    setRemoving(id)
    if (!demo) {
      await withdrawListing(id).catch(() => undefined)
      reload()
    }
    setRemoving(null)
  }

  return (
    <>
      <PageHeader title="My Active Listings" back />

      <PageBody>
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-card bg-line/50" />
            ))}
          </div>
        )}

        {!loading && listings.length === 0 && (
          <div className="card p-10 text-center">
            <h2 className="text-xl">Nothing listed yet</h2>
            <p className="mt-2 text-[15px] text-ink-soft">
              Post your first item and it will show up here.
            </p>
            <Link to="/sell" className="btn-primary mt-5">
              <PlusCircle size={17} /> Create a listing
            </Link>
          </div>
        )}

        <ul className="space-y-3">
          {listings.map((listing) => (
            <li key={listing.id} className="card flex items-center gap-4 p-4">
              <Img
                src={listing.image_url}
                alt={listing.title}
                className="h-20 w-20 shrink-0 rounded-field"
              />
              <div className="min-w-0 flex-1">
                <Link
                  to={`/listing/${listing.id}`}
                  className="block truncate font-bold hover:text-brand-600"
                >
                  {listing.title}
                </Link>
                <p className="mt-1 truncate text-sm text-ink-muted">
                  {listing.location}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="font-bold text-brand-600">
                    {moneyShort(listing.price)}
                  </span>
                  <Badge>{listing.category}</Badge>
                </div>
              </div>
              <button
                onClick={() => void withdraw(listing.id)}
                disabled={removing === listing.id}
                aria-label={`Withdraw ${listing.title}`}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-faint transition hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>

        {listings.length > 0 && (
          <Link to="/sell" className="btn-primary mt-6 w-full py-3.5 lg:w-auto lg:px-8">
            <PlusCircle size={17} /> Create another listing
          </Link>
        )}
      </PageBody>
    </>
  )
}
