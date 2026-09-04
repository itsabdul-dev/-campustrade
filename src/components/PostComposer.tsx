import { useState, type FormEvent } from 'react'
import { createPost } from '../data/api'
import { useAuth } from '../data/AuthProvider'
import type { Post } from '../data/types'
import Sheet from './Sheet'

const categories: { key: Post['category']; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'events', label: 'Events' },
  { key: 'sustainability', label: 'Sustainability' },
]

export default function PostComposer({
  open,
  onClose,
  onPosted,
}: {
  open: boolean
  onClose: () => void
  onPosted: () => void
}) {
  const { profile, demo } = useAuth()
  const [category, setCategory] = useState<Post['category']>('general')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [badge, setBadge] = useState('Student')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setTitle('')
    setBody('')
    setCategory('general')
    setError(null)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (demo || !profile) {
      reset()
      onClose()
      return
    }

    setSaving(true)
    setError(null)
    try {
      await createPost({
        author_id: profile.id,
        author_badge: badge,
        category,
        title: title.trim(),
        body: body.trim(),
        image_url: null,
      })
      reset()
      onPosted()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish the post.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="New post">
      <form onSubmit={(e) => void submit(e)}>
        <fieldset>
          <legend className="font-bold">Category</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                aria-pressed={category === key}
                className={`chip ${category === key ? 'chip-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-6">
          <label htmlFor="post-title" className="block font-bold">
            Title <span className="text-danger">*</span>
          </label>
          <input
            id="post-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What is happening on campus?"
            className="field mt-2"
          />
        </div>

        <div className="mt-5">
          <label htmlFor="post-body" className="block font-bold">
            Details
          </label>
          <textarea
            id="post-body"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share the where, the when, and why people should care..."
            className="field mt-2 resize-y"
          />
        </div>

        <div className="mt-5">
          <label htmlFor="post-badge" className="block font-bold">
            Post as
          </label>
          <select
            id="post-badge"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            className="field mt-2"
          >
            <option>Student</option>
            <option>Student Club</option>
            <option>Green Team</option>
            <option>Local Vendor</option>
            <option>Official</option>
          </select>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="btn-primary mt-6 w-full py-3.5"
        >
          {saving ? 'Publishing...' : 'Publish post'}
        </button>
      </form>
    </Sheet>
  )
}
