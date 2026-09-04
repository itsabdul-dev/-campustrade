import { Link } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'

/**
 * Always visible, on every route, and deliberately not dismissible.
 *
 * The app uses the language of escrow and secure payment throughout. No money
 * moves anywhere, so a standing statement to that effect is the honest floor —
 * a one-time notice someone can close is not enough when the claim is about
 * their money.
 */
export default function DemoBanner() {
  return (
    <div className="sticky top-0 z-[90] flex h-8 items-center justify-center gap-2 bg-amber-400 px-4 text-center text-[12px] font-bold text-amber-950">
      <FlaskConical size={13} className="shrink-0" />
      {/* The short form still carries the whole point; the long one only adds
          context where there is room for it. */}
      <span className="sm:hidden">Demo — no real payments</span>
      <span className="hidden sm:inline">
        Demo project — no real payments are processed.
      </span>
      <Link to="/about" className="shrink-0 underline underline-offset-2">
        Details
      </Link>
    </div>
  )
}
