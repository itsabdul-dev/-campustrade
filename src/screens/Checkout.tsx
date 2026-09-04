import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CreditCard,
  FlaskConical,
  Info,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
  Trash2,
} from 'lucide-react'
import { useCart } from '../data/CartProvider'
import { PageBody, PageHeader } from '../layout/Page'
import { Img, money } from '../components/ui'

const ESCROW_FEE = 5

const methods = [
  { key: 'payfast', label: 'PayFast', icon: CreditCard },
  { key: 'snapscan', label: 'SnapScan', icon: Smartphone },
]

export default function Checkout() {
  const navigate = useNavigate()
  const { items, subtotal, remove } = useCart()
  const [method, setMethod] = useState('payfast')

  const vendors = [...new Set(items.map((line) => line.seller_name))]
  const total = subtotal + (items.length > 0 ? ESCROW_FEE : 0)

  // Order creation now happens at the end of the simulated payment, so the
  // two cannot disagree about whether a payment "succeeded".
  const pay = () => navigate('/checkout/pay')

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Complete Checkout" back wide />
        <PageBody>
          <div className="card p-10 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-sunken text-ink-faint">
              <ShoppingBag size={26} />
            </span>
            <h2 className="mt-4 text-xl">Your basket is empty</h2>
            <p className="mt-2 text-[15px] text-ink-soft">
              Browse the marketplace and add something you need.
            </p>
            <Link to="/explore" className="btn-primary mt-5">
              Explore listings
            </Link>
          </div>
        </PageBody>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Complete Checkout" back wide />

      <PageBody wide>
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-8">
          <section>
            <div className="flex items-center gap-3">
              <ShoppingBag size={22} />
              <h2 className="text-xl font-bold lg:text-2xl">Your Items</h2>
              <span className="ml-auto rounded-full bg-surface-sunken px-3 py-1.5 text-sm font-semibold text-ink-soft">
                {items.length} {items.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            {vendors.map((vendor) => (
              <div key={vendor} className="mt-6">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.12em] text-brand-500">
                  <Store size={15} />
                  {vendor}
                </p>

                <div className="card mt-3 divide-y divide-line">
                  {items
                    .filter((line) => line.seller_name === vendor)
                    .map((line) => (
                      <div
                        key={line.listing_id}
                        className="flex items-center gap-4 p-4"
                      >
                        <Img
                          src={line.image_url}
                          alt={line.title}
                          className="h-16 w-16 shrink-0 rounded-field"
                        />
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/listing/${line.listing_id}`}
                            className="block truncate font-bold hover:text-brand-600"
                          >
                            {line.title}
                          </Link>
                          <div className="mt-2 flex items-center justify-between gap-4">
                            <span className="text-sm text-ink-soft">Qty: 1</span>
                            <span className="font-bold">{money(line.price)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => remove(line.listing_id)}
                          aria-label={`Remove ${line.title}`}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-faint transition hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </section>

          <aside className="mt-9 lg:sticky lg:top-28 lg:mt-0">
            <h2 className="text-xl font-bold lg:text-2xl">Order Summary</h2>

            <div className="card mt-4 p-5">
              <dl className="space-y-3 text-[15px]">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">
                    Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})
                  </dt>
                  <dd className="font-semibold">{money(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Campus Handover</dt>
                  <dd className="font-semibold">FREE</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-between rounded-field bg-brand-50 px-4 py-3 text-brand-600">
                <span className="flex items-center gap-2 font-bold">
                  <ShieldCheck size={17} />
                  Escrow Fee (simulated)
                  <Info size={14} className="opacity-60" />
                </span>
                <span className="font-bold">{money(ESCROW_FEE)}</span>
              </div>

              <p className="mt-3 text-xs italic leading-relaxed text-ink-muted">
                * In a live version this fee would cover holding funds until
                delivery is confirmed. Nothing is charged here.
              </p>

              <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
                <span className="text-lg font-bold">Total amount</span>
                <span className="text-2xl font-extrabold">{money(total)}</span>
              </div>
            </div>

            <h2 className="mt-8 text-xl font-bold lg:text-2xl">Payment Method</h2>
            <div className="mt-4 space-y-3">
              {methods.map(({ key, label, icon: Icon }) => {
                const active = method === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMethod(key)}
                    className={`flex w-full items-center gap-4 rounded-card border p-4 text-left transition ${
                      active
                        ? 'border-brand-500 bg-brand-50/60 ring-4 ring-brand-500/10'
                        : 'border-line bg-surface hover:border-brand-200'
                    }`}
                  >
                    <span
                      className={`grid h-11 w-11 place-items-center rounded-field ${
                        active
                          ? 'bg-brand-500 text-[rgb(var(--on-brand))]'
                          : 'bg-surface-sunken text-ink-soft'
                      }`}
                    >
                      <Icon size={20} />
                    </span>
                    <span
                      className={`font-bold ${active ? 'text-brand-600' : 'text-ink'}`}
                    >
                      {label}
                    </span>
                    <span
                      className={`ml-auto grid h-5 w-5 place-items-center rounded-full border-2 ${
                        active ? 'border-brand-500' : 'border-line'
                      }`}
                    >
                      {active && (
                        <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                      )}
                    </span>
                  </button>
                )
              })}
            </div>

            <button onClick={pay} className="btn-primary mt-6 w-full py-4 text-base">
              <Lock size={17} /> Continue to Payment
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs font-semibold uppercase tracking-wide text-warning">
              <FlaskConical size={12} /> Simulated payment · nothing is charged
            </p>
          </aside>
        </div>
      </PageBody>
    </>
  )
}
