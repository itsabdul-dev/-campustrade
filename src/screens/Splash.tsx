import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'

export default function Splash() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(8)

  useEffect(() => {
    const tick = setInterval(
      () => setProgress((p) => Math.min(p + 6 + Math.random() * 10, 100)),
      140,
    )
    const done = setTimeout(() => navigate('/onboarding'), 2400)
    return () => {
      clearInterval(tick)
      clearTimeout(done)
    }
  }, [navigate])

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-b from-surface via-surface to-accent-50/60 px-6">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="grid h-28 w-28 place-items-center rounded-[32px] bg-accent-50">
          <div className="grid h-20 w-20 place-items-center rounded-[22px] bg-accent-500 text-white shadow-[0_16px_40px_rgba(30,136,255,.35)]">
            <ShoppingBag size={38} strokeWidth={2} />
          </div>
        </div>

        <h1 className="mt-9 text-[40px] font-extrabold tracking-[-.04em] lg:text-5xl">
          Campus<span className="text-accent-500">Trade</span>
        </h1>
        <p className="mt-2 text-xs font-medium uppercase tracking-[.32em] text-ink-faint">
          Your campus marketplace
        </p>

        <div className="mt-24 w-56">
          <div className="h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-500 to-brand-500 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[.18em] text-ink-faint">
            Initializing secure session
          </p>
        </div>
      </div>
    </main>
  )
}
