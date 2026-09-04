import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  HandCoins,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Plus,
  Search,
  Send,
  ShoppingCart,
  SlidersHorizontal,
  Mic,
} from 'lucide-react'
import { useAuth } from '../data/AuthProvider'
import {
  useBlockedIds,
  useConversations,
  useListing,
  useThread,
} from '../data/hooks'
import { markConversationRead, sendMessage } from '../data/api'

import NewConversation from '../components/NewConversation'
import OfferPanel from '../components/OfferPanel'
import ReportBlock from '../components/ReportBlock'
import type { Conversation, Message } from '../data/types'
import { useIsDesktop } from '../components/useMediaQuery'
import { Avatar, Img, VerifiedTick, money } from '../components/ui'

const filters = ['All', 'Unread', 'Groups'] as const

function ConversationList({
  conversations,
  loading,
  activeId,
  onSelect,
  onCompose,
}: {
  conversations: Conversation[]
  loading: boolean
  activeId?: string
  onSelect: (c: Conversation) => void
  onCompose: () => void
}) {
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)

  const visible = conversations
    .filter((c) =>
      filter === 'All' ? true : filter === 'Unread' ? c.unread > 0 : c.group,
    )
    .filter(
      (c) =>
        c.participant.full_name.toLowerCase().includes(search.toLowerCase()) ||
        c.preview.toLowerCase().includes(search.toLowerCase()),
    )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="sticky top-8 z-30 border-b border-line bg-surface/90 backdrop-blur lg:static">
        <div className="px-4 py-3 lg:px-5 lg:py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold lg:text-2xl">Messages</h1>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => setSearching((v) => !v)}
                aria-label="Search messages"
                aria-pressed={searching}
                className={`grid h-10 w-10 place-items-center rounded-full transition ${
                  searching
                    ? 'bg-brand-50 text-brand-500'
                    : 'text-ink-soft hover:bg-surface-sunken'
                }`}
              >
                <Search size={19} />
              </button>
              <button
                onClick={onCompose}
                aria-label="New message"
                className="grid h-10 w-10 place-items-center rounded-full text-ink-soft transition hover:bg-surface-sunken"
              >
                <SlidersHorizontal size={19} />
              </button>
            </div>
          </div>

          {searching && (
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              aria-label="Search conversations"
              className="field mt-3 rounded-full bg-surface-sunken"
            />
          )}

          <div className="mt-3 flex items-center gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  filter === f
                    ? 'bg-brand-500 text-[rgb(var(--on-brand))]'
                    : 'bg-surface-sunken text-ink-soft'
                }`}
              >
                {f}
              </button>
            ))}
            <span className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-ink-muted">
              <Filter size={15} /> {visible.length}
            </span>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 lg:px-5">
              <div className="h-13 w-13 animate-pulse rounded-full bg-line/60" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/3 animate-pulse rounded bg-line/60" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-line/40" />
              </div>
            </div>
          ))}
        {visible.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition lg:px-5 ${
              activeId === c.id ? 'bg-brand-50/70' : 'hover:bg-surface-sunken'
            }`}
          >
            <Avatar
              src={c.participant.avatar_url}
              alt={c.participant.full_name}
              size={52}
              online={c.participant.online}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-bold">{c.participant.full_name}</h3>
                {c.participant.verified && <VerifiedTick />}
                <span
                  className={`ml-auto shrink-0 text-xs font-semibold ${
                    c.unread > 0 ? 'text-brand-500' : 'text-ink-muted'
                  }`}
                >
                  {c.timestamp}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <p
                  className={`truncate text-sm ${
                    c.unread > 0 ? 'font-semibold text-ink' : 'text-ink-muted'
                  }`}
                >
                  {c.preview}
                </p>
                {c.unread > 0 && (
                  <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand-500 px-1.5 text-[11px] font-bold text-white">
                    {c.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}

        {!loading && visible.length === 0 && (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface-sunken text-ink-faint">
              <MessageSquare size={22} />
            </span>
            <p className="mt-3 font-bold">No conversations yet</p>
            <p className="mt-1 text-sm text-ink-muted">
              Message a seller from any listing, or start one here.
            </p>
            <button onClick={onCompose} className="btn-primary mt-5">
              <Plus size={17} /> New message
            </button>
          </div>
        )}

        {!loading && visible.length > 0 && (
          <p className="py-10 text-center text-sm italic text-ink-faint">
            End of recent conversations
          </p>
        )}
      </div>

      <button
        onClick={onCompose}
        aria-label="New message"
        className="fixed bottom-[92px] right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-brand-500 text-[rgb(var(--on-brand))] shadow-pop transition hover:bg-brand-600 lg:hidden"
      >
        <Plus size={26} />
      </button>
    </div>
  )
}

function Bubble({
  message,
  avatarUrl,
}: {
  message: Message
  avatarUrl: string
}) {
  return (
    <div
      className={`flex items-end gap-2.5 ${
        message.outgoing ? 'flex-row-reverse' : ''
      }`}
    >
      {!message.outgoing && <Avatar src={avatarUrl} alt="" size={32} />}
      <div
        className={`max-w-[78%] rounded-[18px] px-4 py-3 text-[15px] leading-relaxed lg:max-w-[60%] ${
          message.outgoing
            ? 'rounded-br-md bg-brand-500 text-[rgb(var(--on-brand))]'
            : 'rounded-bl-md bg-surface-sunken text-ink'
        }`}
      >
        <p>{message.body}</p>
        <p
          className={`mt-1.5 flex items-center justify-end gap-1 text-[11px] ${
            message.outgoing
            ? 'text-[rgb(var(--on-brand))] opacity-70'
            : 'text-ink-faint'
          }`}
        >
          {message.sent_at}
          {message.outgoing && message.read && <span aria-hidden>✓✓</span>}
        </p>
      </div>
    </div>
  )
}

function Thread({
  conversation,
  onBack,
}: {
  conversation: Conversation
  onBack?: () => void
}) {
  const { profile, demo } = useAuth()
  const [draft, setDraft] = useState('')
  const { data: messages, append } = useThread(conversation.id)
  const { data: pinned } = useListing(conversation.listing_id ?? undefined)
  const [offersOpen, setOffersOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  // Opening a thread is the read receipt, which is what clears its badge.
  useEffect(() => {
    if (demo || !profile) return
    void markConversationRead(conversation.id, profile.id).catch(() => undefined)
  }, [conversation.id, profile, demo])

  const send = () => {
    const body = draft.trim()
    if (!body) return

    // Shown immediately, then persisted; the realtime channel skips our own
    // inserts so the message is never rendered twice.
    append({
      id: `local-${Date.now()}`,
      conversation_id: conversation.id,
      outgoing: true,
      body,
      sent_at: new Date().toLocaleTimeString('en-ZA', {
        hour: 'numeric',
        minute: '2-digit',
      }),
      read: false,
    })
    setDraft('')

    if (!demo && profile) {
      void sendMessage(conversation.id, profile.id, body)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <header className="sticky top-8 z-30 flex items-center gap-3 border-b border-line bg-surface/90 px-4 py-3 backdrop-blur lg:static lg:px-6">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Back to messages"
            className="-ml-2 grid h-9 w-9 place-items-center rounded-full transition hover:bg-surface-sunken lg:hidden"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <Avatar
          src={conversation.participant.avatar_url}
          alt=""
          size={38}
          online={conversation.participant.online}
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold leading-tight">
            {conversation.participant.full_name}
          </h2>
          <p className="text-xs text-ink-muted">
            {conversation.participant.online ? 'Active now' : 'Offline'}
          </p>
        </div>
        {pinned && (
          <button
            onClick={() => setOffersOpen(true)}
            aria-label="Offers"
            className="grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-surface-sunken"
          >
            <HandCoins size={20} />
          </button>
        )}
        <Link
          to="/checkout"
          aria-label="View basket"
          className="grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-surface-sunken"
        >
          <ShoppingCart size={20} />
        </Link>
        <button
          onClick={() => setReportOpen(true)}
          aria-label="Report or block"
          className="grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-surface-sunken"
        >
          <MoreVertical size={20} />
        </button>
      </header>

      {pinned && (
        <div className="flex items-center gap-3 border-b border-line px-4 py-3 lg:px-6">
          <Img
            src={pinned.image_url}
            alt={pinned.title}
            className="h-11 w-11 shrink-0 rounded-field"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{pinned.title}</p>
            <p className="font-bold text-brand-600">{money(pinned.price)}</p>
          </div>
          <button
            onClick={() => setOffersOpen(true)}
            className="chip py-1.5 text-sm"
          >
            <HandCoins size={15} /> Offer
          </button>
          <Link to={`/listing/${pinned.id}`} className="chip py-1.5 text-sm">
            Details <ChevronRight size={15} />
          </Link>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 lg:px-6">
        <p className="mx-auto w-fit rounded-full bg-surface-sunken px-3 py-1 text-xs font-bold text-ink-soft">
          Today
        </p>
        {messages.map((m) => (
          <Bubble
            key={m.id}
            message={m}
            avatarUrl={conversation.participant.avatar_url}
          />
        ))}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 border-t border-line bg-surface px-3 py-3 lg:px-6">
        <div className="flex items-center gap-2">
          <button
            aria-label="Attach a file"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-surface-sunken"
          >
            <Paperclip size={20} />
          </button>
          <div className="relative flex-1">
            <Mic
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Type a message..."
              aria-label="Message"
              className="field rounded-full bg-surface-sunken pl-11"
            />
          </div>
          <button
            onClick={send}
            aria-label="Send message"
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition ${
              draft.trim() ? 'bg-brand-500 hover:bg-brand-600' : 'bg-brand-300'
            }`}
          >
            <Send size={19} />
          </button>
        </div>
      </div>

      <OfferPanel
        open={offersOpen}
        onClose={() => setOffersOpen(false)}
        conversationId={conversation.id}
        listing={pinned}
        sellerId={pinned?.seller_id ?? conversation.participant.id}
        sellerName={
          pinned?.seller.full_name ?? conversation.participant.full_name
        }
      />

      <ReportBlock
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        subjectKind="profile"
        subjectId={conversation.participant.id}
        subjectName={conversation.participant.full_name}
        blockable
      />
    </div>
  )
}

export default function Inbox() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const { data: allConversations, loading } = useConversations()
  const { data: blocked } = useBlockedIds()
  const conversations = allConversations.filter(
    (c) => !blocked.includes(c.participant.id),
  )
  const [composeOpen, setComposeOpen] = useState(false)

  const active =
    conversations.find((c) => c.id === id) ?? (isDesktop ? conversations[0] : undefined)

  if (isDesktop) {
    return (
      <div className="flex h-[calc(100vh-2rem)] min-h-0">
        <NewConversation
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
        />
        <div className="w-[380px] shrink-0 border-r border-line bg-surface">
          <ConversationList
            conversations={conversations}
            loading={loading}
            activeId={active?.id}
            onSelect={(c) => navigate(`/inbox/${c.id}`)}
            onCompose={() => setComposeOpen(true)}
          />
        </div>
        <div className="min-w-0 flex-1">
          {active ? (
            <Thread conversation={active} />
          ) : (
            <div className="grid h-full place-items-center px-8 text-center text-ink-muted">
              {loading ? 'Loading conversations...' : 'Select a conversation'}
            </div>
          )}
        </div>
      </div>
    )
  }

  // The mobile tab bar is 76px tall and overlays the page, so the thread is
  // sized to the space above it — otherwise the composer sits under the nav.
  return active ? (
    <div className="flex h-[calc(100dvh-76px-2rem)] min-h-0 flex-col">
      <Thread conversation={active} onBack={() => navigate('/inbox')} />
    </div>
  ) : (
    <>
      <ConversationList
        conversations={conversations}
        loading={loading}
        onSelect={(c) => navigate(`/inbox/${c.id}`)}
        onCompose={() => setComposeOpen(true)}
      />
      <NewConversation open={composeOpen} onClose={() => setComposeOpen(false)} />
    </>
  )
}
