import type { User } from '@supabase/supabase-js'
import { requireSupabase } from '../lib/supabase'
import { invalidate } from './queryCache'
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
  Review,
  Post,
  Profile,
  TrackedOrder,
} from './types'

const PLACEHOLDER_AVATAR =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=70'

type ProfileRow = {
  id: string
  full_name: string
  avatar_url: string | null
  role: Profile['role']
  university: string
  verified: boolean
  rating: number
  review_count: number
  last_seen_at: string
}

const ONLINE_WINDOW_MS = 5 * 60 * 1000

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    full_name: row.full_name,
    avatar_url: row.avatar_url ?? PLACEHOLDER_AVATAR,
    role: row.role,
    university: row.university,
    verified: row.verified,
    rating: Number(row.rating),
    review_count: row.review_count,
    online: Date.now() - new Date(row.last_seen_at).getTime() < ONLINE_WINDOW_MS,
  }
}

const PROFILE_COLUMNS =
  'id, full_name, avatar_url, role, university, verified, rating, review_count, last_seen_at'

// ------------------------------------------------------------------ profiles

export async function fetchProfile(id: string): Promise<Profile> {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', id)
    .single()

  if (error) throw error
  return toProfile(data as ProfileRow)
}

/**
 * Loads the signed-in member's profile, creating the row if it is missing.
 *
 * The handle_new_user trigger normally creates it at sign-up, but a user who
 * existed before the migration ran — or a trigger that failed — would other-
 * wise leave a valid session with no profile, which reads as "logged out".
 */
export async function ensureProfile(user: User): Promise<Profile> {
  const client = requireSupabase()

  const { data, error } = await client
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  if (data) return toProfile(data as ProfileRow)

  const email = user.email ?? ''
  const metadata = user.user_metadata ?? {}

  const { data: created, error: insertError } = await client
    .from('profiles')
    .insert({
      id: user.id,
      full_name:
        (metadata.full_name as string) || email.split('@')[0] || 'Campus member',
      role: ((metadata.role as Profile['role']) ?? 'student'),
      university: (metadata.university as string) || email.split('@')[1] || '',
      verified: Boolean(user.email_confirmed_at),
    })
    .select(PROFILE_COLUMNS)
    .single()

  if (insertError) throw insertError
  return toProfile(created as ProfileRow)
}

// ------------------------------------------------------------------ listings

export async function fetchListings(
  category?: string,
  search?: string,
): Promise<Listing[]> {
  let query = requireSupabase()
    .from('listings')
    .select(
      'id, seller_id, title, price, category, condition, location, image_urls, rating, created_at',
    )
    .eq('status', 'active')
    .limit(60)

  if (category && category !== 'all') query = query.eq('category', category as never)

  // Full-text search across title, description and location, ranked by the
  // weights set on search_vector. Falls back to recency with no query.
  const term = search?.trim()
  if (term) {
    query = query.textSearch('search_vector', term, {
      type: 'websearch',
      config: 'english',
    })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    seller_id: row.seller_id,
    title: row.title,
    price: Number(row.price),
    category: row.category,
    condition: row.condition,
    location: row.location,
    image_url: row.image_urls[0] ?? '',
    rating: Number(row.rating),
    created_at: row.created_at,
  }))
}

export async function createListing(input: {
  seller_id: string
  title: string
  description: string
  price: number
  category: Listing['category']
  condition: Listing['condition']
  location: string
  image_urls: string[]
  status: 'draft' | 'active'
}) {
  const { data, error } = await requireSupabase()
    .from('listings')
    .insert(input)
    .select('id')
    .single()

  if (error) throw error
  return data.id

  invalidate('listings', 'myListings')
}

// -------------------------------------------------------------------- orders

const ORDER_STATUS_LABELS: Record<string, { title: string; body: string }> = {
  placed: {
    title: 'Order Placed',
    body: 'Your request was sent to the seller.',
  },
  in_escrow: {
    title: 'Payment Secured in Escrow',
    body: 'Simulated: in a live version funds would be held until you confirm the item.',
  },
  ready_for_pickup: {
    title: 'Item Arrived / Ready for Meet-up',
    body: 'The seller has arrived at the meet-up point.',
  },
  completed: {
    title: 'Funds Released & Completed',
    body: 'Finalize transaction after inspecting the item.',
  },
}

const TIMELINE: string[] = ['placed', 'in_escrow', 'ready_for_pickup', 'completed']

export async function fetchOrders(profileId: string): Promise<Order[]> {
  const client = requireSupabase()

  // A member is both a buyer and a seller, so the list covers both sides.
  const { data, error } = await client
    .from('orders')
    .select(
      'id, reference, listing_title, image_url, amount, status, placed_at, buyer_id, seller_id',
    )
    .or(`buyer_id.eq.${profileId},seller_id.eq.${profileId}`)
    .order('placed_at', { ascending: false })

  if (error) throw error

  const rows = data ?? []
  if (rows.length === 0) return []

  const others = [
    ...new Set(
      rows.map((r) => (r.buyer_id === profileId ? r.seller_id : r.buyer_id)),
    ),
  ]

  const { data: people } = await client
    .from('profiles')
    .select('id, full_name')
    .in('id', others)

  const nameById = new Map(
    (people ?? []).map((p) => [p.id, p.full_name as string]),
  )

  return rows.map((row) => {
    const selling = row.seller_id === profileId
    const otherId = selling ? row.buyer_id : row.seller_id
    return {
      id: row.id,
      role: selling ? ('selling' as const) : ('buying' as const),
      counterparty: nameById.get(otherId) || 'Campus member',
      reference: `#${row.reference}`,
      listing_title: row.listing_title,
      image_url: row.image_url ?? '',
      amount: Number(row.amount),
      status: row.status === 'cancelled' ? 'completed' : row.status,
      placed_on: new Date(row.placed_at).toLocaleDateString('en-ZA', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      archived: row.status === 'completed' || row.status === 'cancelled',
    }
  })
}

/**
 * Builds the Track Order timeline.
 *
 * Progress comes from recorded events where they exist, but the order's own
 * status is also mapped in: `in_transit` has no event of its own and is not a
 * stage on the timeline, so an order at that status used to render with every
 * step greyed out as though nothing had happened yet.
 */
const STATUS_STAGE: Record<string, number> = {
  placed: 0,
  in_escrow: 1,
  in_transit: 2,
  ready_for_pickup: 2,
  completed: 3,
  cancelled: 3,
}

export async function fetchOrderTimeline(orderId: string): Promise<OrderStep[]> {
  const client = requireSupabase()

  const [{ data, error }, { data: order }] = await Promise.all([
    client
      .from('order_events')
      .select('status, title, body, created_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true }),
    client.from('orders').select('status').eq('id', orderId).maybeSingle(),
  ])

  if (error) throw error

  const reached = new Set((data ?? []).map((e) => e.status))
  const fromEvents = TIMELINE.reduce(
    (last, key, i) => (reached.has(key as never) ? i : last),
    -1,
  )
  const fromStatus = order ? (STATUS_STAGE[order.status] ?? -1) : -1
  const currentIndex = Math.max(fromEvents, fromStatus)

  return TIMELINE.map((key, i) => {
    const recorded = (data ?? []).find((e) => e.status === key)
    return {
      key,
      title: recorded?.title ?? ORDER_STATUS_LABELS[key].title,
      body: recorded?.body || ORDER_STATUS_LABELS[key].body,
      state: i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming',
    }
  })
}

export async function releaseEscrow(orderId: string) {
  const client = requireSupabase()

  const { error } = await client
    .from('orders')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) throw error

  await client.from('order_events').insert({
    order_id: orderId,
    status: 'completed',
    title: ORDER_STATUS_LABELS.completed.title,
    body: 'Buyer confirmed receipt and released the escrow funds.',
  })

  invalidate('orders', 'orderTimeline', 'trackedOrder', 'pendingReviews', 'badges')
}

// ----------------------------------------------------------------- messaging

export async function fetchConversations(profileId: string): Promise<Conversation[]> {
  const client = requireSupabase()

  const { data: memberships, error: membershipError } = await client
    .from('conversation_participants')
    .select('conversation_id, last_read_at')
    .eq('profile_id', profileId)

  if (membershipError) throw membershipError
  const ids = (memberships ?? []).map((m) => m.conversation_id)
  if (ids.length === 0) return []

  const [{ data: conversations, error: convError }, { data: others, error: othersError }] =
    await Promise.all([
      client
        .from('conversations')
        .select('id, is_group, last_message_at, listing_id')
        .in('id', ids)
        .order('last_message_at', { ascending: false }),
      client
        .from('conversation_participants')
        .select(`conversation_id, profiles!inner(${PROFILE_COLUMNS})`)
        .in('conversation_id', ids)
        .neq('profile_id', profileId),
    ])

  if (convError) throw convError
  if (othersError) throw othersError

  const { data: recent, error: recentError } = await client
    .from('messages')
    .select('conversation_id, body, sent_at, sender_id')
    .in('conversation_id', ids)
    .order('sent_at', { ascending: false })

  if (recentError) throw recentError

  const readAt = new Map(
    (memberships ?? []).map((m) => [m.conversation_id, m.last_read_at]),
  )
  const counterpart = new Map(
    (others ?? []).map((row) => [
      row.conversation_id,
      toProfile((row as unknown as { profiles: ProfileRow }).profiles),
    ]),
  )

  return (conversations ?? []).map((c) => {
    const messages = (recent ?? []).filter((m) => m.conversation_id === c.id)
    const since = readAt.get(c.id) ?? new Date(0).toISOString()
    return {
      id: c.id,
      participant:
        counterpart.get(c.id) ??
        ({
          id: 'unknown',
          full_name: 'Campus member',
          avatar_url: PLACEHOLDER_AVATAR,
          role: 'student',
          university: '',
          verified: false,
          rating: 0,
          review_count: 0,
          online: false,
        } satisfies Profile),
      preview: messages[0]?.body ?? 'No messages yet',
      timestamp: relativeTime(c.last_message_at),
      // Your own messages are never unread to you.
      unread: messages.filter(
        (m) => m.sent_at > since && m.sender_id !== profileId,
      ).length,
      group: c.is_group,
      listing_id: c.listing_id,
    }
  })
}

export async function fetchMessages(
  conversationId: string,
  profileId: string,
): Promise<Message[]> {
  const { data, error } = await requireSupabase()
    .from('messages')
    .select('id, conversation_id, sender_id, body, sent_at')
    .eq('conversation_id', conversationId)
    .order('sent_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    conversation_id: row.conversation_id,
    outgoing: row.sender_id === profileId,
    body: row.body,
    sent_at: new Date(row.sent_at).toLocaleTimeString('en-ZA', {
      hour: 'numeric',
      minute: '2-digit',
    }),
    read: true,
  }))
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
) {
  const { error } = await requireSupabase()
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body })

  if (error) throw error
}

/** Live message updates for an open thread. Returns an unsubscribe function. */
export function subscribeToMessages(
  conversationId: string,
  onInsert: (message: Message, senderId: string) => void,
) {
  const client = requireSupabase()

  const channel = client
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const row = payload.new as {
          id: string
          conversation_id: string
          sender_id: string
          body: string
          sent_at: string
        }
        onInsert(
          {
            id: row.id,
            conversation_id: row.conversation_id,
            outgoing: false,
            body: row.body,
            sent_at: new Date(row.sent_at).toLocaleTimeString('en-ZA', {
              hour: 'numeric',
              minute: '2-digit',
            }),
            read: false,
          },
          row.sender_id,
        )
      },
    )
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}

// ----------------------------------------------------------------- community

export async function fetchPosts(category?: string): Promise<Post[]> {
  const client = requireSupabase()

  // No embeds here. posts -> profiles is reachable through author_id and again
  // through post_likes.profile_id, so PostgREST refuses the join as ambiguous
  // and the whole feed fails. Author and like counts are fetched alongside.
  let query = client
    .from('posts')
    .select(
      'id, author_id, author_badge, category, title, body, image_url, comment_count, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(30)

  if (category && category !== 'all') query = query.eq('category', category as never)

  const { data, error } = await query
  if (error) throw error

  const rows = data ?? []
  if (rows.length === 0) return []

  const authorIds = [...new Set(rows.map((r) => r.author_id))]
  const postIds = rows.map((r) => r.id)

  const [{ data: authors }, { data: likes }] = await Promise.all([
    client.from('profiles').select(PROFILE_COLUMNS).in('id', authorIds),
    client.from('post_likes').select('post_id, profile_id').in('post_id', postIds),
  ])

  const authorById = new Map(
    ((authors ?? []) as ProfileRow[]).map((a) => [a.id, a]),
  )
  const likeCount = new Map<string, number>()
  for (const like of likes ?? []) {
    likeCount.set(like.post_id, (likeCount.get(like.post_id) ?? 0) + 1)
  }

  return rows.map((row) => {
    const author = authorById.get(row.author_id)
    return {
      id: row.id,
      author: author?.full_name || 'Campus member',
      author_avatar: author?.avatar_url ?? PLACEHOLDER_AVATAR,
      author_badge: row.author_badge,
      posted_at: relativeTime(row.created_at),
      category: row.category,
      title: row.title,
      body: row.body,
      image_url: row.image_url ?? undefined,
      likes: likeCount.get(row.id) ?? 0,
      comments: row.comment_count,
    }
  })
}

/** Post ids the viewer has already liked, so hearts render in the right state. */
export async function fetchMyLikes(profileId: string): Promise<string[]> {
  const { data, error } = await requireSupabase()
    .from('post_likes')
    .select('post_id')
    .eq('profile_id', profileId)

  if (error) throw error
  return (data ?? []).map((r) => r.post_id)
}

export async function toggleLike(postId: string, profileId: string, liked: boolean) {
  const client = requireSupabase()

  const { error } = liked
    ? await client.from('post_likes').insert({ post_id: postId, profile_id: profileId })
    : await client
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('profile_id', profileId)

  if (error) throw error

  invalidate('posts', 'myLikes')
}

// ------------------------------------------------------------------ helpers

function relativeTime(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

// ------------------------------------------------------- listing detail

export async function fetchListing(
  id: string,
  viewerId?: string,
): Promise<ListingDetail> {
  const client = requireSupabase()

  // The seller is fetched separately rather than embedded. An embed depends on
  // PostgREST resolving the relationship, and when that fails the whole listing
  // query fails with it — which is what made every listing page fall back to
  // the same placeholder.
  const { data, error } = await client
    .from('listings')
    .select(
      'id, seller_id, title, description, price, category, condition, location, image_urls, rating, created_at',
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('That listing no longer exists.')

  let seller: Profile = {
    id: data.seller_id,
    full_name: 'Campus member',
    avatar_url: PLACEHOLDER_AVATAR,
    role: 'student',
    university: '',
    verified: false,
    rating: 0,
    review_count: 0,
    online: false,
  }

  const { data: sellerRow } = await client
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', data.seller_id)
    .maybeSingle()

  if (sellerRow) seller = toProfile(sellerRow as ProfileRow)

  // Save state is a nicety; never let it take the page down with it.
  let saved = false
  if (viewerId) {
    const { data: save } = await client
      .from('saved_listings')
      .select('listing_id')
      .eq('listing_id', id)
      .eq('profile_id', viewerId)
      .maybeSingle()
    saved = Boolean(save)
  }

  return {
    id: data.id,
    seller_id: data.seller_id,
    title: data.title,
    description: data.description,
    price: Number(data.price),
    category: data.category,
    condition: data.condition,
    location: data.location,
    image_url: data.image_urls[0] ?? '',
    image_urls: data.image_urls,
    rating: Number(data.rating),
    created_at: data.created_at,
    seller,
    saved,
  }
}

export async function fetchMyListings(sellerId: string): Promise<Listing[]> {
  const { data, error } = await requireSupabase()
    .from('listings')
    .select(
      'id, seller_id, title, price, category, condition, location, image_urls, rating, created_at',
    )
    .eq('seller_id', sellerId)
    .neq('status', 'withdrawn')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    seller_id: row.seller_id,
    title: row.title,
    price: Number(row.price),
    category: row.category,
    condition: row.condition,
    location: row.location,
    image_url: row.image_urls[0] ?? '',
    rating: Number(row.rating),
    created_at: row.created_at,
  }))
}

export async function withdrawListing(id: string) {
  const { error } = await requireSupabase()
    .from('listings')
    .update({ status: 'withdrawn' })
    .eq('id', id)
  if (error) throw error

  invalidate('listings', 'myListings')
}

export async function toggleSaved(
  listingId: string,
  profileId: string,
  saved: boolean,
) {
  const client = requireSupabase()
  const { error } = saved
    ? await client
        .from('saved_listings')
        .insert({ profile_id: profileId, listing_id: listingId })
    : await client
        .from('saved_listings')
        .delete()
        .eq('profile_id', profileId)
        .eq('listing_id', listingId)
  if (error) throw error

  invalidate('savedListings')
}

// ---------------------------------------------------------- image upload

/** Uploads to the listing-images bucket under the member's own folder. */
export async function uploadListingImage(file: File, profileId: string) {
  const client = requireSupabase()
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${profileId}/${crypto.randomUUID()}.${extension}`

  const { error } = await client.storage
    .from('listing-images')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) throw error

  const { data } = client.storage.from('listing-images').getPublicUrl(path)
  return data.publicUrl
}

// --------------------------------------------------------------- checkout

export interface CheckoutLine {
  listing_id: string
  seller_id: string
  title: string
  price: number
  image_url: string
}

/** One order per line: escrow is held per seller, not per basket. */
export async function placeOrders(buyerId: string, lines: CheckoutLine[]) {
  const client = requireSupabase()

  const { data, error } = await client
    .from('orders')
    .insert(
      lines.map((line) => ({
        listing_id: line.listing_id,
        buyer_id: buyerId,
        seller_id: line.seller_id,
        listing_title: line.title,
        image_url: line.image_url,
        amount: line.price,
        escrow_fee: 5,
        status: 'in_escrow' as const,
        meetup_label: 'University Library (Safe Zone)',
        meetup_address: 'Main Quad, Sector 4B',
      })),
    )
    .select('id')

  if (error) throw error

  const ids = (data ?? []).map((row) => row.id)

  await client.from('order_events').insert(
    ids.flatMap((orderId) => [
      {
        order_id: orderId,
        status: 'placed' as const,
        title: 'Order Placed',
        body: 'Your request was sent to the seller.',
      },
      {
        order_id: orderId,
        status: 'in_escrow' as const,
        title: 'Payment Secured in Escrow',
        body: 'Funds are safely held by CampusTrade until you confirm the item.',
      },
    ]),
  )

  await client
    .from('listings')
    .update({ status: 'sold' })
    .in(
      'id',
      lines.map((l) => l.listing_id),
    )

  invalidate('orders', 'listings', 'listing', 'badges', 'notifications')
  return ids
}

// -------------------------------------------------------------- community

export async function fetchComments(postId: string): Promise<Comment[]> {
  const client = requireSupabase()

  const { data, error } = await client
    .from('post_comments')
    .select('id, author_id, body, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) throw error

  const rows = data ?? []
  if (rows.length === 0) return []

  const { data: authors } = await client
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .in('id', [...new Set(rows.map((r) => r.author_id))])

  const authorById = new Map(
    ((authors ?? []) as ProfileRow[]).map((a) => [a.id, a]),
  )

  return rows.map((row) => {
    const author = authorById.get(row.author_id)
    return {
      id: row.id,
      author: author?.full_name || 'Campus member',
      author_avatar: author?.avatar_url ?? PLACEHOLDER_AVATAR,
      body: row.body,
      posted_at: relativeTime(row.created_at),
    }
  })
}

export async function addComment(postId: string, authorId: string, body: string) {
  const { error } = await requireSupabase()
    .from('post_comments')
    .insert({ post_id: postId, author_id: authorId, body })
  if (error) throw error

  invalidate('comments', 'posts')
}

export async function createPost(input: {
  author_id: string
  author_badge: string
  category: Post['category']
  title: string
  body: string
  image_url: string | null
}) {
  const { error } = await requireSupabase().from('posts').insert(input)
  if (error) throw error

  invalidate('posts')
}

// ----------------------------------------------------------- notifications

export async function fetchNotifications(
  profileId: string,
): Promise<AppNotification[]> {
  const { data, error } = await requireSupabase()
    .from('notifications')
    .select('id, kind, title, body, link, read, created_at')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    link: row.link,
    read: row.read,
    created_at: relativeTime(row.created_at),
  }))
}

export async function markNotificationsRead(profileId: string) {
  const { error } = await requireSupabase()
    .from('notifications')
    .update({ read: true })
    .eq('profile_id', profileId)
    .eq('read', false)
  if (error) throw error
}

// ------------------------------------------------- starting a conversation

/** Finds the existing thread with a member, or opens a new one. */
export async function openConversation(
  meId: string,
  otherId: string,
  listingId?: string,
): Promise<string> {
  const client = requireSupabase()

  const { data: mine, error: mineError } = await client
    .from('conversation_participants')
    .select('conversation_id')
    .eq('profile_id', meId)

  if (mineError) throw mineError
  const myIds = (mine ?? []).map((r) => r.conversation_id)

  if (myIds.length > 0) {
    const { data: shared, error: sharedError } = await client
      .from('conversation_participants')
      .select('conversation_id')
      .eq('profile_id', otherId)
      .in('conversation_id', myIds)
      .limit(1)

    if (sharedError) throw sharedError
    if (shared && shared.length > 0) return shared[0].conversation_id
  }

  const { data: created, error: createError } = await client
    .from('conversations')
    .insert({ listing_id: listingId ?? null, is_group: false })
    .select('id')
    .single()

  if (createError) throw createError

  const { error: participantError } = await client
    .from('conversation_participants')
    .insert([
      { conversation_id: created.id, profile_id: meId },
      { conversation_id: created.id, profile_id: otherId },
    ])

  if (participantError) throw participantError
  return created.id
}

/** Members to start a new conversation with. */
export async function fetchDirectory(meId: string): Promise<Profile[]> {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .neq('id', meId)
    .order('full_name')
    .limit(50)

  if (error) throw error
  return (data as ProfileRow[]).map(toProfile)
}

/** The order behind the Track Order screen, with its seller. */
export async function fetchTrackedOrder(id: string): Promise<TrackedOrder> {
  const client = requireSupabase()

  const { data, error } = await client
    .from('orders')
    .select(
      'id, reference, listing_title, image_url, amount, status, seller_id, meetup_label, meetup_address',
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('That order could not be found.')

  // orders has two foreign keys into profiles, so the seller is read directly
  // rather than relying on an embed hint to pick the right one.
  let seller: Profile = {
    id: data.seller_id,
    full_name: 'Campus member',
    avatar_url: PLACEHOLDER_AVATAR,
    role: 'student',
    university: '',
    verified: false,
    rating: 0,
    review_count: 0,
    online: false,
  }

  const { data: sellerRow } = await client
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', data.seller_id)
    .maybeSingle()

  if (sellerRow) seller = toProfile(sellerRow as ProfileRow)

  return {
    id: data.id,
    reference: `#${data.reference}`,
    listing_title: data.listing_title,
    image_url: data.image_url ?? '',
    amount: Number(data.amount),
    // 'cancelled' exists in the database but not in the UI's status union.
    status: data.status === 'cancelled' ? 'completed' : data.status,
    meetup_label: data.meetup_label ?? 'Campus Safe Zone',
    meetup_address: data.meetup_address ?? 'To be confirmed',
    seller,
  }
}

/** Marks a thread read for the viewer, which is what clears its unread badge. */
export async function markConversationRead(
  conversationId: string,
  profileId: string,
) {
  const { error } = await requireSupabase()
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('profile_id', profileId)

  if (error) throw error

  invalidate('conversations', 'badges')
}

/** Counts for the navigation badges. */
export async function fetchBadges(profileId: string) {
  const client = requireSupabase()

  const [{ count: notifications }, { data: memberships }, { data: orders }] =
    await Promise.all([
      client
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', profileId)
        .eq('read', false),
      client
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('profile_id', profileId),
      client
        .from('orders')
        .select('id, status')
        .or(`buyer_id.eq.${profileId},seller_id.eq.${profileId}`)
        .neq('status', 'completed'),
    ])

  let unreadThreads = 0
  if (memberships && memberships.length > 0) {
    const { data: recent } = await client
      .from('messages')
      .select('conversation_id, sender_id, sent_at')
      .in(
        'conversation_id',
        memberships.map((m) => m.conversation_id),
      )

    for (const membership of memberships) {
      const hasUnread = (recent ?? []).some(
        (m) =>
          m.conversation_id === membership.conversation_id &&
          m.sender_id !== profileId &&
          m.sent_at > membership.last_read_at,
      )
      if (hasUnread) unreadThreads += 1
    }
  }

  return {
    notifications: notifications ?? 0,
    inbox: unreadThreads,
    orders: orders?.length ?? 0,
  }
}

export async function updateProfile(
  profileId: string,
  changes: { full_name?: string; avatar_url?: string | null },
) {
  const { error } = await requireSupabase()
    .from('profiles')
    .update(changes)
    .eq('id', profileId)

  if (error) throw error

  invalidate('reviews', 'directory')
}

/** Uploads an avatar into the member's own folder in the images bucket. */
export async function uploadAvatar(file: File, profileId: string) {
  const client = requireSupabase()
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${profileId}/avatar-${Date.now()}.${extension}`

  const { error } = await client.storage
    .from('listing-images')
    .upload(path, file, { cacheControl: '3600', upsert: true })

  if (error) throw error
  return client.storage.from('listing-images').getPublicUrl(path).data.publicUrl
}

// ------------------------------------------------------------------ reviews

export async function fetchReviews(subjectId: string): Promise<Review[]> {
  const client = requireSupabase()

  const { data, error } = await client
    .from('reviews')
    .select('id, order_id, reviewer_id, rating, body, created_at')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  const rows = data ?? []
  if (rows.length === 0) return []

  const { data: people } = await client
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .in('id', [...new Set(rows.map((r) => r.reviewer_id))])

  const byId = new Map(((people ?? []) as ProfileRow[]).map((p) => [p.id, p]))

  return rows.map((row) => {
    const reviewer = byId.get(row.reviewer_id)
    return {
      id: row.id,
      order_id: row.order_id,
      reviewer: reviewer?.full_name || 'Campus member',
      reviewer_avatar: reviewer?.avatar_url ?? PLACEHOLDER_AVATAR,
      rating: row.rating,
      body: row.body,
      created_at: relativeTime(row.created_at),
    }
  })
}

/**
 * Completed orders the viewer still owes a review on. This is what turns
 * reputation from a decorative number into something that actually accrues.
 */
export async function fetchPendingReviews(
  profileId: string,
): Promise<PendingReview[]> {
  const client = requireSupabase()

  const { data: orders, error } = await client
    .from('orders')
    .select('id, listing_title, image_url, buyer_id, seller_id')
    .eq('status', 'completed')
    .or(`buyer_id.eq.${profileId},seller_id.eq.${profileId}`)
    .order('placed_at', { ascending: false })
    .limit(20)

  if (error) throw error
  const rows = orders ?? []
  if (rows.length === 0) return []

  const { data: done } = await client
    .from('reviews')
    .select('order_id')
    .eq('reviewer_id', profileId)
    .in(
      'order_id',
      rows.map((o) => o.id),
    )

  const reviewed = new Set((done ?? []).map((r) => r.order_id))
  const outstanding = rows.filter((o) => !reviewed.has(o.id))
  if (outstanding.length === 0) return []

  const subjectIds = outstanding.map((o) =>
    o.buyer_id === profileId ? o.seller_id : o.buyer_id,
  )

  const { data: people } = await client
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .in('id', [...new Set(subjectIds)])

  const byId = new Map(((people ?? []) as ProfileRow[]).map((p) => [p.id, p]))

  return outstanding.map((order) => {
    const selling = order.seller_id === profileId
    const subjectId = selling ? order.buyer_id : order.seller_id
    const subject = byId.get(subjectId)
    return {
      order_id: order.id,
      listing_title: order.listing_title,
      image_url: order.image_url ?? '',
      subject_id: subjectId,
      subject_name: subject?.full_name || 'Campus member',
      subject_avatar: subject?.avatar_url ?? PLACEHOLDER_AVATAR,
      role: selling ? ('selling' as const) : ('buying' as const),
    }
  })
}

export async function createReview(input: {
  order_id: string
  reviewer_id: string
  subject_id: string
  rating: number
  body: string
}) {
  const { error } = await requireSupabase().from('reviews').insert(input)
  if (error) throw error

  invalidate('reviews', 'pendingReviews')
}

// ------------------------------------------------------------------- offers

export async function fetchOffers(
  conversationId: string,
): Promise<Offer[]> {
  const client = requireSupabase()

  const { data, error } = await client
    .from('offers')
    .select(
      'id, listing_id, buyer_id, seller_id, amount, status, created_at, listings(title)',
    )
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => {
    const record = row as unknown as {
      id: string
      listing_id: string
      buyer_id: string
      seller_id: string
      amount: number
      status: Offer['status']
      created_at: string
      listings: { title: string } | null
    }
    return {
      id: record.id,
      listing_id: record.listing_id,
      listing_title: record.listings?.title ?? 'Listing',
      buyer_id: record.buyer_id,
      seller_id: record.seller_id,
      amount: Number(record.amount),
      status: record.status,
      created_at: relativeTime(record.created_at),
    }
  })
}

export async function makeOffer(input: {
  listing_id: string
  conversation_id: string
  buyer_id: string
  seller_id: string
  amount: number
}) {
  const { error } = await requireSupabase().from('offers').insert(input)
  if (error) throw error

  invalidate('offers', 'notifications', 'badges')
}

export async function respondToOffer(
  offerId: string,
  status: 'accepted' | 'declined' | 'withdrawn',
) {
  const { error } = await requireSupabase()
    .from('offers')
    .update({ status, responded_at: new Date().toISOString() })
    .eq('id', offerId)
  if (error) throw error

  invalidate('offers', 'notifications', 'badges')
}

// ------------------------------------------------------------ saved listings

export async function fetchSavedListings(profileId: string): Promise<Listing[]> {
  const client = requireSupabase()

  const { data: saves, error } = await client
    .from('saved_listings')
    .select('listing_id, created_at')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })

  if (error) throw error
  const ids = (saves ?? []).map((s) => s.listing_id)
  if (ids.length === 0) return []

  const { data, error: listingError } = await client
    .from('listings')
    .select(
      'id, seller_id, title, price, category, condition, location, image_urls, rating, created_at',
    )
    .in('id', ids)

  if (listingError) throw listingError

  return (data ?? []).map((row) => ({
    id: row.id,
    seller_id: row.seller_id,
    title: row.title,
    price: Number(row.price),
    category: row.category,
    condition: row.condition,
    location: row.location,
    image_url: row.image_urls[0] ?? '',
    rating: Number(row.rating),
    created_at: row.created_at,
  }))
}

// --------------------------------------------------------- report and block

export async function reportContent(input: {
  reporter_id: string
  subject_kind: 'listing' | 'post' | 'profile' | 'message'
  subject_id: string
  reason: string
  detail: string
}) {
  const { error } = await requireSupabase().from('reports').insert(input)
  // A duplicate report is the same outcome for the reporter: it is on record.
  if (error && error.code !== '23505') throw error
}

export async function blockMember(blockerId: string, blockedId: string) {
  const { error } = await requireSupabase()
    .from('blocks')
    .insert({ blocker_id: blockerId, blocked_id: blockedId })
  if (error && error.code !== '23505') throw error

  invalidate('blocked', 'listings', 'conversations')
}

export async function unblockMember(blockerId: string, blockedId: string) {
  const { error } = await requireSupabase()
    .from('blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
  if (error) throw error

  invalidate('blocked', 'listings', 'conversations')
}

export async function fetchBlockedIds(profileId: string): Promise<string[]> {
  const { data, error } = await requireSupabase()
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', profileId)

  if (error) throw error
  return (data ?? []).map((r) => r.blocked_id)
}

/** Live notification inserts for the signed-in member. */
export function subscribeToNotifications(
  profileId: string,
  onInsert: (notification: AppNotification) => void,
) {
  const client = requireSupabase()

  const channel = client
    .channel(`notifications:${profileId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `profile_id=eq.${profileId}`,
      },
      (payload) => {
        const row = payload.new as {
          id: string
          kind: string
          title: string
          body: string
          link: string | null
          read: boolean
          created_at: string
        }
        onInsert({
          id: row.id,
          kind: row.kind,
          title: row.title,
          body: row.body,
          link: row.link,
          read: row.read,
          created_at: 'Just now',
        })
      },
    )
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}
