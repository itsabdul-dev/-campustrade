import { useEffect, useState } from 'react'

/** Holds a value still for `delay` ms — used so each keystroke is not a query. */
export function useDebounced<T>(value: T, delay = 300) {
  const [settled, setSettled] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return settled
}
