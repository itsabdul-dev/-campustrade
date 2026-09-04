import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Heart,
  Leaf,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  Users,
} from 'lucide-react'
import { useAuth } from '../data/AuthProvider'
import { useMyLikes, usePosts } from '../data/hooks'
import { toggleLike } from '../data/api'
import CommentsSheet from '../components/CommentsSheet'
import LoadError from '../components/LoadError'
import PostComposer from '../components/PostComposer'
import type { Post, PostCategory } from '../data/types'
import { Avatar, Img } from '../components/ui'

const tabs = [
  { key: 'all', label: 'All Posts' },
  { key: 'events', label: 'Events' },
  { key: 'sustainability', label: 'Sustainable' },
] as const

const categoryMeta: Record<
  PostCategory,
  { label: string; icon: typeof Calendar; className: string }
> = {
  events: { label: 'Events', icon: Calendar, className: 'text-brand-500' },
  sustainability: { label: 'Sustainability', icon: Leaf, className: 'text-positive' },
  general: { label: 'General', icon: Users, className: 'text-accent-500' },
}

const badgeTone = (badge: string) => {
  if (badge === 'Green Team') return 'bg-positive-soft text-positive'
  if (badge === 'Local Vendor') return 'bg-danger-soft text-danger'
  if (badge === 'Official') return 'bg-surface-sunken text-ink-soft'
  return 'bg-brand-50 text-brand-600'
}

function PostCard({
  post,
  onComment,
  initiallyLiked,
}: {
  post: Post
  onComment: (post: Post) => void
  initiallyLiked: boolean
}) {
  const { profile, demo } = useAuth()
  const [liked, setLiked] = useState(initiallyLiked)

  const like = () => {
    const next = !liked
    setLiked(next)
    if (!demo && profile) {
      // Optimistic: the count updates immediately and a failed write is
      // corrected on the next load rather than blocking the tap.
      void toggleLike(post.id, profile.id, next).catch(() => setLiked(!next))
    }
  }
  const meta = categoryMeta[post.category]
  const Icon = meta.icon

  return (
    <article className="card flex flex-col overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <Avatar src={post.author_avatar} alt={post.author} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold leading-tight">{post.author}</h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeTone(
                post.author_badge,
              )}`}
            >
              {post.author_badge}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-ink-muted">{post.posted_at}</p>
        </div>
        <button
          aria-label="Post options"
          className="grid h-8 w-8 place-items-center rounded-full text-ink-faint transition hover:bg-surface-sunken"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="px-4">
        <p
          className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.12em] ${meta.className}`}
        >
          <Icon size={14} />
          {meta.label}
        </p>
        <h2 className="mt-2 text-xl leading-snug">{post.title}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{post.body}</p>
      </div>

      {post.image_url && (
        <div className="p-4">
          <Img
            src={post.image_url}
            alt=""
            className="aspect-[16/10] w-full rounded-field"
          />
        </div>
      )}

      <div className="mt-auto flex items-center gap-5 border-t border-line px-4 py-3">
        <button
          onClick={like}
          className={`flex items-center gap-2 text-sm font-semibold transition ${
            liked ? 'text-danger' : 'text-ink-soft hover:text-ink'
          }`}
        >
          <Heart size={19} className={liked ? 'fill-danger-solid' : undefined} />
          {post.likes + (liked ? 1 : 0)}
        </button>
        <button
          onClick={() => onComment(post)}
          className="flex items-center gap-2 text-sm font-semibold text-ink-soft transition hover:text-ink"
        >
          <MessageCircle size={19} />
          {post.comments}
        </button>
        <button
          onClick={() => void share(post)}
          aria-label="Share"
          className="ml-auto text-ink-soft transition hover:text-ink"
        >
          <Share2 size={19} />
        </button>
      </div>
    </article>
  )
}

/** Uses the native share sheet where it exists, and the clipboard otherwise. */
async function share(post: Post) {
  const url = `${window.location.origin}/community#${post.id}`
  try {
    if (navigator.share) {
      await navigator.share({ title: post.title, text: post.body, url })
    } else {
      await navigator.clipboard.writeText(url)
    }
  } catch {
    // A dismissed share sheet is a normal outcome, not an error.
  }
}

export default function Community() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<(typeof tabs)[number]['key']>('all')
  const [composerOpen, setComposerOpen] = useState(false)
  const [commentsFor, setCommentsFor] = useState<Post | null>(null)
  const { data: visible, loading, error, reload } = usePosts(tab)
  const { data: myLikes } = useMyLikes()

  return (
    <>
      <header className="sticky top-8 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto max-w-shell px-4 py-3 lg:px-8 lg:py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-[-.03em] text-brand-600 lg:text-2xl lg:text-ink">
              CampusHub
            </h1>
            <div className="ml-auto flex items-center gap-2">
              <Link
                to="/explore"
                aria-label="Search the marketplace"
                className="grid h-10 w-10 place-items-center rounded-full bg-surface-sunken text-ink-soft transition hover:bg-line"
              >
                <Search size={18} />
              </Link>
              <Avatar
                src={profile?.avatar_url ?? ''}
                alt={profile?.full_name ?? 'Your profile'}
                size={38}
                online
              />
            </div>
          </div>

          <div className="mt-3 flex gap-1 rounded-full bg-surface-sunken p-1 lg:max-w-md">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tab === key
                    ? 'bg-surface text-brand-600 shadow-sm'
                    : 'text-ink-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-shell px-4 py-5 lg:px-8 lg:py-8">
        <p className="eyebrow flex items-center gap-3">
          Trending Now
          <span className="h-px flex-1 bg-line" />
        </p>

        {error && (
          <div className="mt-4">
            <LoadError error={error} onRetry={reload} what="the feed" />
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="card mt-4 p-10 text-center">
            <h2 className="text-xl">Nothing posted yet</h2>
            <p className="mt-2 text-[15px] text-ink-soft">
              Be the first to share something with your campus.
            </p>
            <button onClick={() => setComposerOpen(true)} className="btn-primary mt-5">
              <Plus size={17} /> New post
            </button>
          </div>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:gap-6 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-card bg-line/50" />
              ))
            : visible.map((post) => (
                <PostCard
                  key={`${post.id}-${myLikes.includes(post.id)}`}
                  post={post}
                  onComment={setCommentsFor}
                  initiallyLiked={myLikes.includes(post.id)}
                />
              ))}
        </div>
      </div>

      <button
        onClick={() => setComposerOpen(true)}
        aria-label="New post"
        className="fixed bottom-[92px] right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-brand-500 text-[rgb(var(--on-brand))] shadow-pop transition hover:bg-brand-600 lg:bottom-8 lg:right-8"
      >
        <Plus size={26} />
      </button>

      <PostComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPosted={reload}
      />

      <CommentsSheet
        postId={commentsFor?.id}
        open={Boolean(commentsFor)}
        onClose={() => setCommentsFor(null)}
      />
    </>
  )
}
