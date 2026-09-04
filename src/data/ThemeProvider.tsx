import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'

interface ThemeValue {
  /** What the member picked. */
  choice: ThemeChoice
  /** What is actually on screen once `system` is resolved. */
  resolved: 'light' | 'dark'
  setChoice: (next: ThemeChoice) => void
}

const ThemeContext = createContext<ThemeValue | null>(null)
const STORAGE_KEY = 'campustrade.pref.theme'

function readStored(): ThemeChoice {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  } catch {
    // Private browsing can refuse reads.
  }
  return 'system'
}

function systemPrefersDark() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setStoredChoice] = useState<ThemeChoice>(readStored)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  // Follow the OS while the choice is `system`, including live changes.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemDark(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const resolved: 'light' | 'dark' =
    choice === 'system' ? (systemDark ? 'dark' : 'light') : choice

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolved === 'dark')
    // Keeps browser UI (form controls, scrollbars) in step with the page.
    root.style.colorScheme = resolved

    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', resolved === 'dark' ? '#0e1015' : '#5A5AE6')
    }
  }, [resolved])

  const setChoice = useCallback((next: ThemeChoice) => {
    setStoredChoice(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage can be unavailable; the choice still applies this session.
    }
  }, [])

  const value = useMemo<ThemeValue>(
    () => ({ choice, resolved, setChoice }),
    [choice, resolved, setChoice],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside ThemeProvider')
  return value
}
