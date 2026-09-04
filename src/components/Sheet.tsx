import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

/**
 * Bottom sheet on a phone, side panel on desktop — one component so overlays
 * follow the same responsive rule as the screens.
 */
export default function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 lg:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full flex-col rounded-t-[22px] bg-surface lg:max-w-lg lg:rounded-[22px]"
      >
        <header className="flex items-center gap-3 border-b border-line px-5 py-4">
          <h2 className="flex-1 text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-surface-sunken"
          >
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}
