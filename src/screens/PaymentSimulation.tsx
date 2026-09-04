import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  CreditCard,
  FlaskConical,
  Loader2,
  Lock,
  ShieldCheck,
  X,
} from 'lucide-react'
import { placeOrders } from '../data/api'
import { useAuth } from '../data/AuthProvider'
import { useCart } from '../data/CartProvider'
import { money } from '../components/ui'

const ESCROW_FEE = 5

/**
 * A staged mock of a payment gateway.
 *
 * It deliberately looks and paces like the real thing, because the point of the
 * project is the trading experience. It just as deliberately collects nothing:
 * no card number, no CVV, no bank login. A form that asked for those would be
 * indistinguishable from a phishing page whatever the label said, so the
 * "authorisation" is a button, and every screen is stamped as a simulation.
 */

type Stage = {
  key: string
  label: string
  detail: string
  ms: number
}

const stages: Stage[] = [
  {
    key: 'connect',
    label: 'Connecting to PayFast',
    detail: 'Opening a secure channel to the payment provider',
    ms: 1100,
  },
  {
    key: 'verify',
    label: 'Verifying your student account',
    detail: 'Confirming your university email is in good standing',
    ms: 900,
  },
  {
    key: 'authorise',
    label: 'Authorising the amount',
    detail: 'Checking the funds are available to reserve',
    ms: 1300,
  },
  {
    key: 'escrow',
    label: 'Moving funds into escrow',
    detail: 'Held by CampusTrade until you confirm the handover',
    ms: 1200,
  },
  {
    key: 'notify',
    label: 'Notifying the seller',
    detail: 'Sending the meet-up request',
    ms: 800,
  },
]

export default function PaymentSimulation() {
  const navigate = useNavigate()
  const { profile, demo } = useAuth()
  const { items, subtotal, clear } = useCart()

  const [phase, setPhase] = useState<'intro' | 'running' | 'done' | 'failed'>(
    'intro',
  )
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const placed = useRef(false)

  const liveTotal = subtotal + (items.length > 0 ? ESCROW_FEE : 0)
  // Emptying the basket is what completes the purchase, so the amount and item
  // count are captured first — otherwise the receipt renders R0.00 for 0 items.
  const [receipt, setReceipt] = useState({
    total: liveTotal,
    count: items.length,
  })

  useEffect(() => {
    if (phase === 'intro') setReceipt({ total: liveTotal, count: items.length })
  }, [phase, liveTotal, items.length])

  const total = phase === 'intro' ? liveTotal : receipt.total
  const count = phase === 'intro' ? items.length : receipt.count

  useEffect(() => {
    if (items.length === 0 && phase === 'intro') navigate('/checkout')
  }, [items.length, phase, navigate])

  // Walk the stages, then write the orders once at the end.
  useEffect(() => {
    if (phase !== 'running') return

    if (step >= stages.length) {
      if (placed.current) return
      placed.current = true

      const finish = async () => {
        if (demo || !profile) {
          clear()
          setPhase('done')
          return
        }
        try {
          const ids = await placeOrders(
            profile.id,
            items.map((line) => ({
              listing_id: line.listing_id,
              seller_id: line.seller_id,
              title: line.title,
              price: line.price,
              image_url: line.image_url,
            })),
          )
          sessionStorage.setItem('campustrade.lastOrder', ids[0] ?? '')
          clear()
          setPhase('done')
        } catch (err) {
          placed.current = false
          setError(err instanceof Error ? err.message : 'Could not place the order.')
          setPhase('failed')
        }
      }
      void finish()
      return
    }

    const timer = setTimeout(() => setStep((n) => n + 1), stages[step].ms)
    return () => clearTimeout(timer)
  }, [phase, step, demo, profile, items, clear])

  if (phase === 'done') {
    const orderId = sessionStorage.getItem('campustrade.lastOrder')
    return (
      <main className="grid min-h-[calc(100dvh-2rem)] place-items-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-positive-soft text-positive">
            <Check size={40} strokeWidth={3} />
          </span>
          <h1 className="mt-6 text-3xl">Payment simulated</h1>
          <p className="mt-3 text-[17px] text-ink-soft">
            {money(receipt.total)} would be held in escrow until you confirm the
            handover.
          </p>

          <div className="mt-6 rounded-card bg-warning-soft p-4 text-left text-sm text-warning">
            <p className="flex items-center gap-2 font-bold">
              <FlaskConical size={15} /> Nothing was charged
            </p>
            <p className="mt-1 opacity-90">
              This is a university project. No payment provider was contacted and
              no money moved. The order below is real data in the app so you can
              follow the rest of the flow.
            </p>
          </div>

          <button
            onClick={() =>
              navigate(orderId ? `/orders/track?order=${orderId}` : '/orders')
            }
            className="btn-primary mt-7 w-full py-4 text-base"
          >
            Track this order
          </button>
          <button
            onClick={() => navigate('/explore')}
            className="btn-ghost mt-3 w-full py-3.5"
          >
            Keep browsing
          </button>
        </div>
      </main>
    )
  }

  if (phase === 'failed') {
    return (
      <main className="grid min-h-[calc(100dvh-2rem)] place-items-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-danger-soft text-danger">
            <X size={38} strokeWidth={3} />
          </span>
          <h1 className="mt-6 text-3xl">Could not place the order</h1>
          <p className="mt-3 text-[15px] text-ink-soft">
            The simulated payment finished, but saving the order failed.
          </p>
          {error && (
            <p className="mt-4 break-words rounded-field bg-surface-sunken p-3 font-mono text-xs text-ink-soft">
              {error}
            </p>
          )}
          <button
            onClick={() => {
              setStep(0)
              setError(null)
              setPhase('running')
            }}
            className="btn-primary mt-6 w-full py-3.5"
          >
            Try again
          </button>
          <button
            onClick={() => navigate('/checkout')}
            className="btn-ghost mt-3 w-full py-3.5"
          >
            Back to checkout
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="grid min-h-[calc(100dvh-2rem)] place-items-center px-6 py-10">
      <div className="w-full max-w-md">
        {/* Styled like a gateway hand-off, so the flow reads correctly. */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 bg-ink px-5 py-4 text-white">
            <span className="grid h-10 w-10 place-items-center rounded-field bg-white/15">
              <CreditCard size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-tight">PayFast</p>
              <p className="flex items-center gap-1.5 text-xs text-white/70">
                <Lock size={11} /> Sandbox · simulated
              </p>
            </div>
            <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-950">
              Demo
            </span>
          </div>

          <div className="p-6">
            <p className="text-sm text-ink-muted">Amount to reserve</p>
            <p className="mt-1 text-4xl font-extrabold tracking-tight">
              {money(total)}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              {count} {count === 1 ? 'item' : 'items'} · {money(ESCROW_FEE)}{' '}
              escrow fee
            </p>

            {phase === 'intro' ? (
              <>
                <div className="mt-6 rounded-field bg-warning-soft p-4 text-sm text-warning">
                  <p className="flex items-center gap-2 font-bold">
                    <FlaskConical size={15} /> Simulation only
                  </p>
                  <p className="mt-1 opacity-90">
                    No card details are collected and no money moves. This screen
                    exists so the marketplace flow can be demonstrated end to end.
                  </p>
                </div>

                <button
                  onClick={() => setPhase('running')}
                  className="btn-primary mt-6 w-full py-4 text-base"
                >
                  <ShieldCheck size={18} /> Simulate payment
                </button>
                <button
                  onClick={() => navigate('/checkout')}
                  className="btn-ghost mt-3 w-full py-3.5"
                >
                  Cancel
                </button>
              </>
            ) : (
              <ol className="mt-6 space-y-4">
                {stages.map((stage, i) => {
                  const state =
                    i < step ? 'done' : i === step ? 'active' : 'waiting'
                  return (
                    <li key={stage.key} className="flex gap-3">
                      <span
                        className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full transition ${
                          state === 'done'
                            ? 'bg-positive-solid text-white'
                            : state === 'active'
                              ? 'bg-brand-500 text-[rgb(var(--on-brand))]'
                              : 'bg-surface-sunken text-ink-faint'
                        }`}
                      >
                        {state === 'done' ? (
                          <Check size={15} strokeWidth={3} />
                        ) : state === 'active' ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block font-bold ${
                            state === 'waiting' ? 'text-ink-faint' : 'text-ink'
                          }`}
                        >
                          {stage.label}
                        </span>
                        <span
                          className={`mt-0.5 block text-sm ${
                            state === 'waiting'
                              ? 'text-ink-faint'
                              : 'text-ink-soft'
                          }`}
                        >
                          {stage.detail}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-ink-faint">
          CampusTrade is a student project. PayFast is named to illustrate the
          intended integration and is not involved.
        </p>
      </div>
    </main>
  )
}
