import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { useAuth } from '../data/AuthProvider'
import { Notice } from './ui'
import Sheet from './Sheet'

export default function PasswordSettings({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { setPassword, demo } = useAuth()
  const [password, setValue] = useState('')
  const [confirm, setConfirm] = useState('')
  const [reveal, setReveal] = useState(false)
  const [status, setStatus] = useState<'idle' | 'busy' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()

    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Those passwords do not match.')
      return
    }
    if (demo) {
      setStatus('done')
      return
    }

    setStatus('busy')
    setError(null)
    try {
      await setPassword(password)
      setStatus('done')
      setValue('')
      setConfirm('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the password.')
      setStatus('idle')
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Password">
      <p className="text-[15px] leading-relaxed text-ink-soft">
        Your password is how you sign in. Changing it here takes effect
        immediately and signs you in with the new one from now on.
      </p>

      <form onSubmit={(e) => void submit(e)} className="mt-6">
        <label htmlFor="new-password" className="block font-bold">
          New password
        </label>
        <div className="relative mt-2">
          <KeyRound
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            id="new-password"
            type={reveal ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setValue(e.target.value)}
            placeholder="At least 8 characters"
            className="field px-11"
          />
          <button
            type="button"
            onClick={() => setReveal(!reveal)}
            aria-label={reveal ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-ink-faint transition hover:bg-surface-sunken"
          >
            {reveal ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        <label htmlFor="confirm-password" className="mt-5 block font-bold">
          Confirm password
        </label>
        <input
          id="confirm-password"
          type={reveal ? 'text' : 'password'}
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Type it again"
          className="field mt-2"
        />

        {error && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        )}

        {status === 'done' ? (
          <div className="mt-6">
            <Notice title="Password saved">
              You can now sign in with your email and this password.
            </Notice>
          </div>
        ) : (
          <button
            type="submit"
            disabled={status === 'busy'}
            className="btn-primary mt-6 w-full py-3.5"
          >
            {status === 'busy' ? 'Saving...' : 'Save password'}
          </button>
        )}
      </form>
    </Sheet>
  )
}
