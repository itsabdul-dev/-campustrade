import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

/** Sticky header + centred content column shared by every in-shell screen. */
export function PageHeader({
  title,
  back,
  actions,
  children,
  wide,
}: {
  title?: string
  back?: boolean
  actions?: ReactNode
  children?: ReactNode
  wide?: boolean
}) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-8 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <div
        className={`mx-auto flex min-h-[60px] items-center gap-3 px-4 py-3 lg:px-8 ${
          wide ? 'max-w-shell' : 'max-w-3xl'
        }`}
      >
        {back && (
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="-ml-2 grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-surface-sunken"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {title && (
          <h1 className="flex-1 truncate text-center text-lg font-bold lg:text-left lg:text-2xl">
            {title}
          </h1>
        )}
        {children}
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}

export function PageBody({
  children,
  wide,
  className = '',
}: {
  children: ReactNode
  wide?: boolean
  className?: string
}) {
  return (
    <div
      className={`mx-auto w-full px-4 py-5 lg:px-8 lg:py-8 ${
        wide ? 'max-w-shell' : 'max-w-3xl'
      } ${className}`}
    >
      {children}
    </div>
  )
}
