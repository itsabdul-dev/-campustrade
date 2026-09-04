import { useState, type FormEvent } from 'react'
import { Check, HandCoins, X } from 'lucide-react'
import { makeOffer, respondToOffer } from '../data/api'
import { useAuth } from '../data/AuthProvider'
import { useOffers } from '../data/hooks'
import { useCart } from '../data/CartProvider'
import type { Listing, Offer } from '../data/types'
import { money } from './ui'
import Sheet from './Sheet'

function OfferCard({
  offer,
  isSeller,
  onRespond,
}: {
  offer: Offer
  isSeller: boolean
  onRespond: (status: 'accepted' | 'declined' | 'withdrawn') => void
}) {
  const tone =
    offer.status === 'accepted'
      ? 'border-positive/30 bg-positive-soft'
      : offer.status === 'declined' || offer.status === 'withdrawn'
        ? 'border-line bg-surface-sunken'
        : 'border-brand-200 bg-brand-50'

  return (
    <div className={`rounded-card border p-4 ${tone}`}>
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.12em] text-ink-muted">
        <HandCoins size={14} />
        {isSeller ? 'Offer received' : 'Your offer'} · {offer.created_at}
      </p>

      <p className="mt-2 text-2xl font-extrabold">{money(offer.amount)}</p>
      <p className="mt-0.5 truncate text-sm text-ink-soft">{offer.listing_title}</p>

      {offer.status === 'pending' ? (
        isSeller ? (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => onRespond('accepted')}
              className="btn-primary flex-1 py-2.5 text-sm"
            >
              <Check size={16} /> Accept
            </button>
            <button
              onClick={() => onRespond('declined')}
              className="btn-ghost flex-1 py-2.5 text-sm"
            >
              <X size={16} /> Decline
            </button>
          </div>
        ) : (
          <button
            onClick={() => onRespond('withdrawn')}
            className="btn-ghost mt-4 w-full py-2.5 text-sm"
          >
            Withdraw offer
          </button>
        )
      ) : (
        <p
          className={`mt-3 text-sm font-bold capitalize ${
            offer.status === 'accepted' ? 'text-positive' : 'text-ink-muted'
          }`}
        >
          {offer.status}
          {offer.status === 'accepted' && !isSeller && ' — add it to your basket below'}
        </p>
      )}
    </div>
  )
}

export default function OfferPanel({
  open,
  onClose,
  conversationId,
  listing,
  sellerId,
  sellerName,
}: {
  open: boolean
  onClose: () => void
  conversationId: string
  listing: Listing | null
  sellerId: string
  sellerName: string
}) {
  const { profile, demo } = useAuth()
  const cart = useCart()
  const { data: offers, reload } = useOffers(open ? conversationId : undefined)
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSeller = profile?.id === sellerId
  const accepted = offers.find((o) => o.status === 'accepted')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const value = Number(amount)
    if (!listing || !value || value <= 0) return

    if (demo || !profile) {
      setAmount('')
      return
    }

    setBusy(true)
    setError(null)
    try {
      await makeOffer({
        listing_id: listing.id,
        conversation_id: conversationId,
        buyer_id: profile.id,
        seller_id: sellerId,
        amount: value,
      })
      setAmount('')
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the offer.')
    } finally {
      setBusy(false)
    }
  }

  const respond = async (
    offerId: string,
    status: 'accepted' | 'declined' | 'withdrawn',
  ) => {
    if (demo) return
    await respondToOffer(offerId, status).catch(() => undefined)
    reload()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Offers">
      {!listing ? (
        <p className="py-10 text-center text-[15px] text-ink-muted">
          Offers need a listing. Start this chat from the item you want to buy.
        </p>
      ) : (
        <>
          <div className="rounded-card bg-surface-sunken p-4">
            <p className="text-sm text-ink-muted">Asking price</p>
            <p className="mt-1 text-2xl font-extrabold">{money(listing.price)}</p>
            <p className="mt-0.5 truncate text-sm text-ink-soft">{listing.title}</p>
          </div>

          {offers.length > 0 && (
            <ul className="mt-5 space-y-3">
              {offers.map((offer) => (
                <li key={offer.id}>
                  <OfferCard
                    offer={offer}
                    isSeller={isSeller}
                    onRespond={(status) => void respond(offer.id, status)}
                  />
                </li>
              ))}
            </ul>
          )}

          {accepted && !isSeller && (
            <button
              onClick={() => {
                // The accepted price is what gets checked out, not the asking
                // price, so the basket carries the negotiated amount.
                cart.add({ ...listing, price: accepted.amount }, sellerName)
                onClose()
              }}
              className="btn-primary mt-5 w-full py-3.5"
            >
              Add to basket at {money(accepted.amount)}
            </button>
          )}

          {!isSeller && !accepted && (
            <form onSubmit={(e) => void submit(e)} className="mt-6">
              <label htmlFor="offer-amount" className="block font-bold">
                Make an offer
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="offer-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Less than ${money(listing.price)}`}
                  className="field"
                />
                <button
                  type="submit"
                  disabled={busy || !amount}
                  className="btn-primary shrink-0 px-6"
                >
                  Send
                </button>
              </div>
              <p className="mt-2 text-sm text-ink-muted">
                The seller is notified and can accept or decline.
              </p>
            </form>
          )}

          {isSeller && offers.length === 0 && (
            <p className="mt-6 text-center text-[15px] text-ink-muted">
              No offers on this listing yet.
            </p>
          )}

          {error && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          )}
        </>
      )}
    </Sheet>
  )
}
