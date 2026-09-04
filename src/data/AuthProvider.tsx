import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { ensureProfile } from './api'
import { clearQueryCache } from './queryCache'
import { currentUser } from './mock'
import type { Profile } from './types'

type Status = 'loading' | 'signed_out' | 'ready' | 'error'

interface AuthValue {
  /** The signed-in member, or the mock member when Supabase is not configured. */
  profile: Profile | null
  session: Session | null
  status: Status
  /** Set when a session exists but the profile could not be loaded. */
  error: string | null
  /** True while running on fixtures — screens use it to skip write calls. */
  demo: boolean
  /** Magic link. Resolves to true when a password was set instead. */
  signUp: (
    email: string,
    role: Profile['role'],
    password?: string,
  ) => Promise<'link' | 'session'>
  signIn: (email: string) => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
  setPassword: (password: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  signOut: () => Promise<void>
  retry: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(
    isSupabaseConfigured ? null : currentUser,
  )
  const [status, setStatus] = useState<Status>(
    isSupabaseConfigured ? 'loading' : 'ready',
  )
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  // A failed magic link comes back as query or fragment params rather than an
  // exception, so it is read here instead of disappearing silently.
  useEffect(() => {
    if (!isSupabaseConfigured) return
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const search = new URLSearchParams(window.location.search)
    const description =
      fragment.get('error_description') ?? search.get('error_description')
    if (description) setError(description.replace(/\+/g, ' '))
  }, [])

  useEffect(() => {
    if (!supabase) return

    let active = true

    // getSession() waits for the client to finish reading tokens out of the
    // URL, so this resolves after a magic-link redirect has been consumed.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      if (!data.session) setStatus('signed_out')
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return

      // Supabase re-emits on token refresh and when the tab regains focus. The
      // session object is new each time, so storing it unconditionally changed
      // the identity of a dependency and re-ran the profile effect — which
      // blanked the whole app back to the loading spinner every time you
      // switched tabs. Only a genuine change of user is worth reacting to.
      setSession((prev) => (prev?.user?.id === next?.user?.id ? prev : next))

      if (!next) {
        // Cached rows belong to the member who was signed in. Dropping them on
        // sign-out stops the next person seeing anything of theirs.
        clearQueryCache()
        setProfile(null)
        setStatus('signed_out')
      }
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    if (!session?.user) return

    let cancelled = false
    // Only block the UI on the first resolve. A refetch behind an already
    // loaded profile must not tear the app down to a spinner.
    setStatus((current) => (current === 'ready' ? current : 'loading'))

    ensureProfile(session.user)
      .then((p) => {
        if (cancelled) return
        setProfile(p)
        setError(null)
        setStatus('ready')
      })
      .catch((err: Error) => {
        if (cancelled) return
        // A signed-in user whose profile will not load is an error to show,
        // not a reason to bounce them back to the login form.
        setProfile(null)
        setError(err.message)
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [session, nonce])

  const signUp = useCallback(
    async (email: string, role: Profile['role'], password?: string) => {
      if (!supabase) return 'link' as const

      const metadata = { role, university: email.split('@')[1] ?? '' }

      // With a password we can create a real credential; the confirmation
      // email still has to be opened before the account can be used.
      if (password) {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/explore`,
            data: metadata,
          },
        })
        if (err) throw err
        return data.session ? ('session' as const) : ('link' as const)
      }

      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/explore`,
          data: metadata,
        },
      })
      if (err) throw err
      return 'link' as const
    },
    [],
  )

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) return
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) throw err
  }, [])

  /** Adds or changes a password on an account created with a magic link. */
  const setPassword = useCallback(async (password: string) => {
    if (!supabase) return
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) throw err
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) return
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`,
    })
    if (err) throw err
  }, [])

  const signIn = useCallback(async (email: string) => {
    if (!supabase) return
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/explore` },
    })
    if (err) throw err
  }, [])

  const signOut = useCallback(async () => {
    clearQueryCache()
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      profile,
      session,
      status,
      error,
      demo: !isSupabaseConfigured,
      signUp,
      signIn,
      signInWithPassword,
      setPassword,
      resetPassword,
      signOut,
      retry: () => setNonce((n) => n + 1),
    }),
    [
      profile,
      session,
      status,
      error,
      signUp,
      signIn,
      signInWithPassword,
      setPassword,
      resetPassword,
      signOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
