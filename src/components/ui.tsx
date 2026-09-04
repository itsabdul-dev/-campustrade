import { type ReactNode, useState } from 'react'
import { Check, ShieldCheck, Star } from 'lucide-react'

/**
 * Rand, formatted the way the designs show it: comma thousands separator and a
 * full stop before the cents. `en-ZA` groups with spaces and uses a decimal
 * comma, so the grouping locale is pinned to `en-US` deliberately.
 */
export const money = (value: number) =>
  `R${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

/** Price overlays on listing cards drop trailing zero cents: R45, not R45.00. */
export const moneyShort = (value: number) =>
  `R${value.toLocaleString('en-US', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`

/**
 * Photos come from a remote CDN in this prototype. The gradient underneath
 * means a slow or blocked image still reads as a deliberate surface rather
 * than a broken box.
 */
export function Img({
  src,
  alt,
  className = '',
}: {
  src?: string
  alt: string
  className?: string
}) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-brand-100 via-surface-sunken to-accent-50 ${className}`}
    >
      {src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          // A cached image can finish before React attaches onLoad, so the ref
          // catches that case and the handler covers the rest.
          ref={(el) => {
            if (el?.complete) setLoaded(true)
          }}
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  )
}

export function Avatar({
  src,
  alt,
  size = 40,
  online,
  ring,
}: {
  src: string
  alt: string
  size?: number
  online?: boolean
  ring?: boolean
}) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <Img
        src={src}
        alt={alt}
        className={`h-full w-full rounded-full ${
          ring ? 'ring-4 ring-brand-100' : ''
        }`}
      />
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-surface bg-positive-solid"
          style={{
            width: Math.min(size * 0.28, 20),
            height: Math.min(size * 0.28, 20),
          }}
        />
      )}
    </div>
  )
}

export function VerifiedTick({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-white ${className}`}
    >
      <Check size={10} strokeWidth={3.5} />
    </span>
  )
}

export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <Star size={14} className="fill-amber-400 text-amber-400" />
      <span className="font-semibold text-ink">{value.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-ink-muted">({count})</span>
      )}
    </span>
  )
}

const toneMap = {
  brand: 'bg-brand-50 text-brand-600',
  amber: 'bg-warning-soft text-warning ring-1 ring-warning/30',
  blue: 'bg-accent-50 text-accent-600 ring-1 ring-accent-100',
  green: 'bg-positive-soft text-positive',
  pink: 'bg-danger-soft text-danger',
  neutral: 'bg-surface-sunken text-ink-soft',
} as const

export function Badge({
  children,
  tone = 'neutral',
  icon,
}: {
  children: ReactNode
  tone?: keyof typeof toneMap
  icon?: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${toneMap[tone]}`}
    >
      {icon}
      {children}
    </span>
  )
}

export function Notice({
  title,
  children,
  icon = <ShieldCheck size={18} />,
  tone = 'brand',
}: {
  title?: string
  children: ReactNode
  icon?: ReactNode
  tone?: 'brand' | 'blue'
}) {
  const styles =
    tone === 'blue'
      ? 'bg-accent-50 text-accent-600'
      : 'bg-brand-50 text-brand-600'
  return (
    <div className={`flex gap-3 rounded-field p-4 ${styles}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="text-sm leading-relaxed">
        {title && <p className="font-bold">{title}</p>}
        <p className={title ? 'mt-0.5 opacity-90' : 'opacity-90'}>{children}</p>
      </div>
    </div>
  )
}

export function Toggle({
  defaultOn = false,
  storageKey,
  label,
}: {
  defaultOn?: boolean
  /** Persists the choice per device. Preferences are not synced to the server. */
  storageKey?: string
  label?: string
}) {
  const [on, setOn] = useState(() => {
    if (!storageKey) return defaultOn
    try {
      const saved = localStorage.getItem(storageKey)
      return saved === null ? defaultOn : saved === 'true'
    } catch {
      return defaultOn
    }
  })

  const change = (next: boolean) => {
    setOn(next)
    if (!storageKey) return
    try {
      localStorage.setItem(storageKey, String(next))
    } catch {
      // Storage can be unavailable; the toggle still works for this session.
    }
  }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => change(!on)}
      aria-label={label}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        on ? 'bg-brand-500' : 'bg-line'
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
          on ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  )
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-xl font-bold lg:text-2xl">{children}</h2>
      {action}
    </div>
  )
}
