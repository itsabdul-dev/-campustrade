import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { updateProfile, uploadAvatar } from '../data/api'
import { useAuth } from '../data/AuthProvider'
import { Avatar } from './ui'
import Sheet from './Sheet'

export default function EditProfile({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { profile, demo, retry } = useAuth()
  const [name, setName] = useState(profile?.full_name ?? '')
  const [avatar, setAvatar] = useState(profile?.avatar_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const pickAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (demo || !profile) {
      setAvatar(URL.createObjectURL(file))
      return
    }

    setUploading(true)
    setError(null)
    try {
      setAvatar(await uploadAvatar(file, profile.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload the photo.')
    } finally {
      setUploading(false)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (demo || !profile) {
      onClose()
      return
    }

    setSaving(true)
    setError(null)
    try {
      await updateProfile(profile.id, {
        full_name: name.trim(),
        avatar_url: avatar || null,
      })
      retry() // reloads the profile behind the app
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Edit profile">
      <form onSubmit={(e) => void submit(e)}>
        <div className="flex items-center gap-4">
          <Avatar src={avatar} alt={name || 'Your avatar'} size={72} ring />
          <div>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void pickAvatar(e)}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="btn-ghost py-2.5 text-sm"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Uploading
                </>
              ) : (
                <>
                  <Upload size={16} /> Change photo
                </>
              )}
            </button>
            <p className="mt-2 text-xs text-ink-muted">JPG, PNG or WebP, up to 5MB.</p>
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="display-name" className="block font-bold">
            Display name <span className="text-danger">*</span>
          </label>
          <input
            id="display-name"
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="How other students see you"
            className="field mt-2"
          />
          <p className="mt-2 text-sm text-ink-muted">
            This starts as the first part of your email address. Use your real
            name so buyers know who they are meeting.
          </p>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="btn-primary mt-6 w-full py-3.5"
        >
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </Sheet>
  )
}
