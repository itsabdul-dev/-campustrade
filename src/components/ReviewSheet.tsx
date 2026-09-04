import { useState, type FormEvent } from 'react'
import { createReview } from '../data/api'
import { useAuth } from '../data/AuthProvider'
import type { PendingReview } from '../data/types'
import { Avatar, Img } from './ui'
import Sheet from './Sheet'
import StarRating from './StarRating'

export default function ReviewSheet({
  pending,
  onClose,
  onDone,
}: {
  pending: PendingReview | null
  onClose: () => void
  onDone: () => void
}) {
  const { profile, demo } = useAuth()
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!pending) return

    if (demo || !profile) {
      onClose()
      return
    }

    setSaving(true)
    setError(null)
    try {
      await createReview({
        order_id: pending.order_id,
        reviewer_id: profile.id,
        subject_id: pending.subject_id,
        rating,
        body: body.trim(),
      })
      setBody('')
      setRating(5)
      onDone()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your review.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open={Boolean(pending)}
      onClose={onClose}
      title={pending?.role === 'selling' ? 'Rate the buyer' : 'Rate the seller'}
    >
      {pending && (
        <form onSubmit={(e) => void submit(e)}>
          <div className="flex items-center gap-3 rounded-card bg-surface-sunken p-4">
            <Img
              src={pending.image_url}
              alt={pending.listing_title}
              className="h-12 w-12 shrink-0 rounded-field"
            />
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">
              {pending.listing_title}
            </p>
          </div>

          <div className="mt-6 flex flex-col items-center text-center">
            <Avatar
              src={pending.subject_avatar}
              alt={pending.subject_name}
              size={64}
            />
            <p className="mt-3 font-bold">{pending.subject_name}</p>
            <p className="mt-1 text-sm text-ink-muted">
              How did the handover go?
            </p>
            <div className="mt-4">
              <StarRating value={rating} onChange={setRating} size={30} />
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="review-body" className="block font-bold">
              Add a comment
            </label>
            <textarea
              id="review-body"
              rows={4}
              maxLength={1000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Were they on time? Was the item as described?"
              className="field mt-2 resize-y"
            />
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary mt-6 w-full py-3.5"
          >
            {saving ? 'Posting...' : 'Post review'}
          </button>
        </form>
      )}
    </Sheet>
  )
}
