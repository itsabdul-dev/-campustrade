import { useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import { addComment } from '../data/api'
import { useAuth } from '../data/AuthProvider'
import { useComments } from '../data/hooks'
import type { Comment } from '../data/types'
import { Avatar } from './ui'
import Sheet from './Sheet'

export default function CommentsSheet({
  postId,
  open,
  onClose,
}: {
  postId?: string
  open: boolean
  onClose: () => void
}) {
  const { profile, demo } = useAuth()
  const { data: comments, loading, reload } = useComments(open ? postId : undefined)
  const [draft, setDraft] = useState('')
  const [local, setLocal] = useState<Comment[]>([])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body || !postId) return

    setLocal((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        author: profile?.full_name ?? 'You',
        author_avatar: profile?.avatar_url ?? '',
        body,
        posted_at: 'Just now',
      },
    ])
    setDraft('')

    if (!demo && profile) {
      await addComment(postId, profile.id, body).catch(() => undefined)
      reload()
    }
  }

  const all = [...comments, ...local]

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Comments${all.length ? ` (${all.length})` : ''}`}
      footer={
        <form onSubmit={(e) => void submit(e)} className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment..."
            aria-label="Add a comment"
            className="field rounded-full bg-surface-sunken"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Post comment"
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition ${
              draft.trim() ? 'bg-brand-500 hover:bg-brand-600' : 'bg-brand-300'
            }`}
          >
            <Send size={18} />
          </button>
        </form>
      }
    >
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-field bg-line/50" />
          ))}
        </div>
      )}

      {!loading && all.length === 0 && (
        <p className="py-10 text-center text-[15px] text-ink-muted">
          No comments yet. Be the first.
        </p>
      )}

      <ul className="space-y-4">
        {all.map((comment) => (
          <li key={comment.id} className="flex gap-3">
            <Avatar src={comment.author_avatar} alt={comment.author} size={38} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="truncate font-bold">{comment.author}</span>
                <span className="shrink-0 text-xs text-ink-faint">
                  {comment.posted_at}
                </span>
              </div>
              <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">
                {comment.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
