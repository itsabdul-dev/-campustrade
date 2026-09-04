import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured } from '../lib/supabase'
import { FRESH_MS, queryCache as cache } from './queryCache'
import * as api from './api'
import * as fixtures from './mock'
import { useAuth } from './AuthProvider'
import type {
  AppNotification,
  Comment,
  Conversation,
  Listing,
  ListingDetail,
  Message,
  Offer,
  Order,
  OrderStep,
  PendingReview,
  Post,
  Review,
  TrackedOrder,
} from './types'

interface Query<T> {
  data: T
  loading: boolean
  error: Error | null
  reload: () => void
}

function useQuery<T>(
  key: string,
  load: () => Promise<T>,
  demoValue: T,
  emptyValue: T,
  deps: unknown[],
  enabled = true,
): Query<T> {
  const cacheKey = `${key}|${JSON.stringify(deps)}`
  const cached = isSupabaseConfigured
    ? (cache.get(cacheKey) as { data: T; at: number } | undefined)
    : undefined

  const [data, setData] = useState<T>(
    isSupabaseConfigured ? (cached?.data ?? emptyValue) : demoValue,
  )
  // Only block on the first ever load of a query. A refresh behind cached data
  // must not flash a skeleton over content that is already on screen.
  const [loading, setLoading] = useState(
    isSupabaseConfigured && enabled && !cached,
  )
  const [error, setError] = useState<Error | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setData(demoValue)
      setLoading(false)
      return
    }
    if (!enabled) {
      setData(emptyValue)
      setLoading(false)
      return
    }

    const hit = cache.get(cacheKey) as { data: T; at: number } | undefined
    if (hit) {
      setData(hit.data)
      setLoading(false)
      // Still fresh, and not an explicit reload: nothing to do.
      if (nonce === 0 && Date.now() - hit.at < FRESH_MS) return
    } else {
      setLoading(true)
    }

    let cancelled = false

    load()
      .then((result) => {
        cache.set(cacheKey, { data: result, at: Date.now() })
        if (cancelled) return
        setData(result)
        setError(null)
      })
      .catch((err: Error) => {
        if (cancelled) return
        // Failing to empty is honest; failing to a fixture is a lie that looks
        // like working software. Cached data is kept — it was once real.
        if (!cache.has(cacheKey)) setData(emptyValue)
        setError(err)
      })
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
    // `load`, `demoValue` and `emptyValue` are recreated per render; the deps
    // array describes what the query actually varies on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, nonce, enabled])

  return {
    data,
    loading,
    error,
    reload: () => {
      cache.delete(cacheKey)
      setNonce((n) => n + 1)
    },
  }
}

export function useListings(category: string, search = '') {
  const term = search.trim().toLowerCase()
  const demo = fixtures.listings.filter(
    (l) =>
      (category === 'all' || l.category === category) &&
      (!term || l.title.toLowerCase().includes(term)),
  )

  const query = useQuery<Listing[]>(
    'listings',
    () => api.fetchListings(category, search),
    demo,
    [],
    [category, search],
  )

  // Blocking is enforced in the client because a listing stays publicly
  // readable; the point is that the person who blocked stops seeing them.
  const { data: blocked } = useBlockedIds()
  return {
    ...query,
    data: query.data.filter((l) => !blocked.includes(l.seller_id)),
  }
}

export function useListing(id?: string) {
  const { profile } = useAuth()

  // Demo mode resolves the fixture by id too, so navigation behaves the same
  // way it does against the database.
  const base =
    fixtures.listings.find((l) => l.id === id) ?? fixtures.listings[0]

  const demo: ListingDetail = {
    ...base,
    description:
      'Used for one semester and kept in a sleeve, so there is no highlighting or spine damage. Happy to meet at the library.',
    image_urls: [base.image_url],
    seller: fixtures.currentUser,
    saved: false,
  }

  return useQuery<ListingDetail | null>(
    'listing',
    () => api.fetchListing(id!, profile?.id),
    demo,
    null,
    [id, profile?.id],
    Boolean(id),
  )
}

export function useMyListings() {
  const { profile } = useAuth()
  return useQuery<Listing[]>(
    'myListings',
    () => api.fetchMyListings(profile!.id),
    fixtures.listings.slice(0, 3),
    [],
    [profile?.id],
    Boolean(profile),
  )
}

export function useOrders() {
  const { profile } = useAuth()
  return useQuery<Order[]>(
    'orders',
    () => api.fetchOrders(profile!.id),
    fixtures.orders,
    [],
    [profile?.id],
    Boolean(profile),
  )
}

export function useOrder(orderId?: string) {
  return useQuery<TrackedOrder | null>(
    'trackedOrder',
    () => api.fetchTrackedOrder(orderId!),
    fixtures.trackedOrder,
    null,
    [orderId],
    Boolean(orderId),
  )
}

/** The four escrow stages with no progress recorded yet. */
const BLANK_TIMELINE: OrderStep[] = fixtures.orderSteps.map((step) => ({
  ...step,
  state: 'upcoming' as const,
}))

export function useOrderTimeline(orderId?: string) {
  return useQuery<OrderStep[]>(
    'orderTimeline',
    () => api.fetchOrderTimeline(orderId!),
    fixtures.orderSteps,
    BLANK_TIMELINE,
    [orderId],
    Boolean(orderId),
  )
}

export function useConversations() {
  const { profile } = useAuth()
  return useQuery<Conversation[]>(
    'conversations',
    () => api.fetchConversations(profile!.id),
    fixtures.conversations,
    [],
    [profile?.id],
    Boolean(profile),
  )
}

export function usePosts(category: string) {
  const demo =
    category === 'all'
      ? fixtures.posts
      : fixtures.posts.filter((p) => p.category === category)

  return useQuery<Post[]>('posts', () => api.fetchPosts(category), demo, [], [category])
}

export function useNotifications() {
  const { profile } = useAuth()
  return useQuery<AppNotification[]>(
    'notifications',
    () => api.fetchNotifications(profile!.id),
    FIXTURE_NOTIFICATIONS,
    [],
    [profile?.id],
    Boolean(profile),
  )
}

export function useComments(postId?: string) {
  return useQuery<Comment[]>(
    'comments',
    () => api.fetchComments(postId!),
    FIXTURE_COMMENTS,
    [],
    [postId],
    Boolean(postId),
  )
}

export function useDirectory() {
  const { profile } = useAuth()
  return useQuery(
    'directory',
    () => api.fetchDirectory(profile!.id),
    fixtures.conversations.map((c) => c.participant),
    [],
    [profile?.id],
    Boolean(profile),
  )
}

/** Thread messages, kept live through the realtime channel while mounted. */
export function useThread(conversationId?: string) {
  const { profile } = useAuth()
  const query = useQuery<Message[]>(
    'thread',
    () => api.fetchMessages(conversationId!, profile!.id),
    fixtures.thread,
    [],
    [conversationId, profile?.id],
    Boolean(conversationId && profile),
  )

  const [live, setLive] = useState<Message[]>([])

  useEffect(() => {
    setLive([])
    if (!isSupabaseConfigured || !conversationId || !profile) return
    return api.subscribeToMessages(conversationId, (message, senderId) => {
      if (senderId === profile.id) return
      setLive((prev) => [...prev, message])
    })
  }, [conversationId, profile])

  const append = useCallback((message: Message) => {
    setLive((prev) => [...prev, message])
  }, [])

  return { ...query, data: [...query.data, ...live], append }
}

const FIXTURE_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    kind: 'order',
    title: 'New order received',
    body: 'Someone bought "Introduction to Psychology (11th Ed)".',
    link: '/orders',
    read: false,
    created_at: '2m ago',
  },
  {
    id: 'n2',
    kind: 'escrow',
    title: 'Escrow funds released',
    body: 'Payment for "Ergonomic Mesh Office Chair" has been released to you.',
    link: '/orders',
    read: false,
    created_at: '3h ago',
  },
  {
    id: 'n3',
    kind: 'message',
    title: 'Sarah Jenkins replied',
    body: 'I just sent over the final designs for the listing page.',
    link: '/inbox',
    read: true,
    created_at: 'Yesterday',
  },
]

const FIXTURE_COMMENTS: Comment[] = [
  {
    id: 'cm1',
    author: 'David Chen',
    author_avatar: fixtures.conversations[1].participant.avatar_url,
    body: 'Count me in — I will bring the flask.',
    posted_at: '1h ago',
  },
  {
    id: 'cm2',
    author: 'Aisha Patel',
    author_avatar: fixtures.conversations[4].participant.avatar_url,
    body: 'Is there space for one more?',
    posted_at: '40m ago',
  },
]

const NO_BADGES = { notifications: 0, inbox: 0, orders: 0 }

/** Live counts for the navigation badges. */
export function useBadges() {
  const { profile } = useAuth()
  return useQuery(
    'badges',
    () => api.fetchBadges(profile!.id),
    { notifications: 3, inbox: 9, orders: 2 },
    NO_BADGES,
    [profile?.id],
    Boolean(profile),
  )
}

/** Post ids the viewer has liked, so hearts render in the right state. */
export function useMyLikes() {
  const { profile } = useAuth()
  return useQuery<string[]>(
    'myLikes',
    () => api.fetchMyLikes(profile!.id),
    [],
    [],
    [profile?.id],
    Boolean(profile),
  )
}

export function useReviews(subjectId?: string) {
  return useQuery<Review[]>(
    'reviews',
    () => api.fetchReviews(subjectId!),
    [],
    [],
    [subjectId],
    Boolean(subjectId),
  )
}

export function usePendingReviews() {
  const { profile } = useAuth()
  return useQuery<PendingReview[]>(
    'pendingReviews',
    () => api.fetchPendingReviews(profile!.id),
    [],
    [],
    [profile?.id],
    Boolean(profile),
  )
}

export function useSavedListings() {
  const { profile } = useAuth()
  return useQuery<Listing[]>(
    'savedListings',
    () => api.fetchSavedListings(profile!.id),
    fixtures.listings.slice(0, 2),
    [],
    [profile?.id],
    Boolean(profile),
  )
}

export function useOffers(conversationId?: string) {
  return useQuery<Offer[]>(
    'offers',
    () => api.fetchOffers(conversationId!),
    [],
    [],
    [conversationId],
    Boolean(conversationId),
  )
}

export function useBlockedIds() {
  const { profile } = useAuth()
  return useQuery<string[]>(
    'blocked',
    () => api.fetchBlockedIds(profile!.id),
    [],
    [],
    [profile?.id],
    Boolean(profile),
  )
}
