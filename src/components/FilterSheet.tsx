import type { Condition } from '../data/types'
import Sheet from './Sheet'

const conditions: { key: Condition | 'any'; label: string }[] = [
  { key: 'any', label: 'Any' },
  { key: 'new', label: 'New' },
  { key: 'like_new', label: 'Like New' },
  { key: 'excellent', label: 'Excellent' },
  { key: 'good', label: 'Good' },
  { key: 'fair', label: 'Fair' },
]

const sorts = [
  { key: 'recent', label: 'Most recent' },
  { key: 'price_asc', label: 'Price: low to high' },
  { key: 'price_desc', label: 'Price: high to low' },
  { key: 'rating', label: 'Highest rated' },
] as const

export type SortKey = (typeof sorts)[number]['key']

export default function FilterSheet({
  open,
  onClose,
  condition,
  setCondition,
  maxPrice,
  setMaxPrice,
  sort,
  setSort,
}: {
  open: boolean
  onClose: () => void
  condition: Condition | 'any'
  setCondition: (value: Condition | 'any') => void
  maxPrice: string
  setMaxPrice: (value: string) => void
  sort: SortKey
  setSort: (value: SortKey) => void
}) {
  const reset = () => {
    setCondition('any')
    setMaxPrice('')
    setSort('recent')
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filters"
      footer={
        <div className="flex gap-3">
          <button onClick={reset} className="btn-ghost flex-1 py-3">
            Reset
          </button>
          <button onClick={onClose} className="btn-primary flex-1 py-3">
            Show results
          </button>
        </div>
      }
    >
      <fieldset>
        <legend className="font-bold">Condition</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {conditions.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setCondition(key)}
              aria-pressed={condition === key}
              className={`chip ${condition === key ? 'chip-active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-7">
        <label htmlFor="max-price" className="block font-bold">
          Maximum price
        </label>
        <input
          id="max-price"
          type="number"
          min="0"
          inputMode="numeric"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="No limit"
          className="field mt-2"
        />
      </div>

      <fieldset className="mt-7">
        <legend className="font-bold">Sort by</legend>
        <div className="mt-3 space-y-2">
          {sorts.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              aria-pressed={sort === key}
              className={`flex w-full items-center gap-3 rounded-field border px-4 py-3 text-left text-[15px] font-medium transition ${
                sort === key
                  ? 'border-brand-500 bg-brand-50/60 text-brand-600'
                  : 'border-line hover:bg-surface-sunken'
              }`}
            >
              <span
                className={`grid h-5 w-5 place-items-center rounded-full border-2 ${
                  sort === key ? 'border-brand-500' : 'border-line'
                }`}
              >
                {sort === key && (
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                )}
              </span>
              {label}
            </button>
          ))}
        </div>
      </fieldset>
    </Sheet>
  )
}
