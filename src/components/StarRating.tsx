import { Star } from 'lucide-react'

export default function StarRating({
  value,
  onChange,
  size = 18,
}: {
  value: number
  /** Omit to render a read-only rating. */
  onChange?: (value: number) => void
  size?: number
}) {
  const stars = [1, 2, 3, 4, 5]

  if (!onChange) {
    return (
      <span className="inline-flex gap-0.5" aria-label={`${value} out of 5`}>
        {stars.map((n) => (
          <Star
            key={n}
            size={size}
            className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-line'}
          />
        ))}
      </span>
    )
  }

  return (
    <span className="inline-flex gap-1" role="radiogroup" aria-label="Rating">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition hover:scale-110"
        >
          <Star
            size={size}
            className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-line'}
          />
        </button>
      ))}
    </span>
  )
}
