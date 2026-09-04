import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Listing } from './types'

export interface CartItem {
  listing_id: string
  seller_id: string
  seller_name: string
  title: string
  price: number
  image_url: string
}

interface CartValue {
  items: CartItem[]
  count: number
  subtotal: number
  add: (listing: Listing, sellerName: string) => void
  remove: (listingId: string) => void
  clear: () => void
  has: (listingId: string) => boolean
}

const CartContext = createContext<CartValue | null>(null)
const STORAGE_KEY = 'campustrade.cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    // A basket should survive a refresh; it is per-device state, not shared.
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as CartItem[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Private browsing can refuse writes; the basket still works in memory.
    }
  }, [items])

  const add = useCallback((listing: Listing, sellerName: string) => {
    setItems((prev) =>
      prev.some((i) => i.listing_id === listing.id)
        ? prev
        : [
            ...prev,
            {
              listing_id: listing.id,
              seller_id: listing.seller_id,
              seller_name: sellerName,
              title: listing.title,
              price: listing.price,
              image_url: listing.image_url,
            },
          ],
    )
  }, [])

  const remove = useCallback((listingId: string) => {
    setItems((prev) => prev.filter((i) => i.listing_id !== listingId))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CartValue>(
    () => ({
      items,
      count: items.length,
      subtotal: items.reduce((sum, i) => sum + i.price, 0),
      add,
      remove,
      clear,
      has: (id) => items.some((i) => i.listing_id === id),
    }),
    [items, add, remove, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart must be used inside CartProvider')
  return value
}
