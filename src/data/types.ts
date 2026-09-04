/**
 * These types mirror the tables we will create in Supabase, so swapping the
 * mock modules for real queries is a change of data source, not of components.
 */

export type Role = 'student' | 'faculty' | 'vendor' | 'resident'

export type Condition = 'new' | 'like_new' | 'excellent' | 'good' | 'fair'

export type ListingCategory =
  | 'textbooks'
  | 'electronics'
  | 'services'
  | 'furniture'
  | 'housing'

export interface Profile {
  id: string
  full_name: string
  avatar_url: string
  role: Role
  university: string
  verified: boolean
  rating: number
  review_count: number
  online: boolean
}

export interface Listing {
  id: string
  seller_id: string
  title: string
  price: number
  category: ListingCategory
  condition: Condition
  location: string
  image_url: string
  rating: number
  created_at: string
}

export interface CartLine {
  listing_id: string
  vendor: string
  title: string
  variant?: string
  qty: number
  price: number
  image_url: string
}

export type OrderStatus =
  | 'placed'
  | 'in_escrow'
  | 'in_transit'
  | 'ready_for_pickup'
  | 'completed'

export interface Order {
  id: string
  /** Which side of the trade the viewer is on. */
  role: 'buying' | 'selling'
  counterparty: string
  reference: string
  listing_title: string
  image_url: string
  amount: number
  status: OrderStatus
  placed_on: string
  archived: boolean
}

export interface OrderStep {
  key: string
  title: string
  body: string
  state: 'done' | 'current' | 'upcoming'
}

export interface Conversation {
  id: string
  participant: Profile
  preview: string
  timestamp: string
  unread: number
  group: boolean
  /** The listing the chat was started from, pinned above the thread. */
  listing_id: string | null
}

export interface Message {
  id: string
  conversation_id: string
  outgoing: boolean
  body: string
  sent_at: string
  read: boolean
}

export type PostCategory = 'events' | 'sustainability' | 'general'

export interface Post {
  id: string
  author: string
  author_avatar: string
  author_badge: string
  posted_at: string
  category: PostCategory
  title: string
  body: string
  image_url?: string
  likes: number
  comments: number
}

export interface Comment {
  id: string
  author: string
  author_avatar: string
  body: string
  posted_at: string
}

export interface AppNotification {
  id: string
  kind: string
  title: string
  body: string
  link: string | null
  read: boolean
  created_at: string
}

export interface ListingDetail extends Listing {
  description: string
  image_urls: string[]
  seller: Profile
  saved: boolean
}

export interface TrackedOrder {
  id: string
  reference: string
  listing_title: string
  image_url: string
  amount: number
  status: OrderStatus
  meetup_label: string
  meetup_address: string
  seller: Profile
}

export interface Review {
  id: string
  order_id: string
  reviewer: string
  reviewer_avatar: string
  rating: number
  body: string
  created_at: string
}

/** A completed order the viewer has not reviewed yet. */
export interface PendingReview {
  order_id: string
  listing_title: string
  image_url: string
  subject_id: string
  subject_name: string
  subject_avatar: string
  role: 'buying' | 'selling'
}

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn'

export interface Offer {
  id: string
  listing_id: string
  listing_title: string
  buyer_id: string
  seller_id: string
  amount: number
  status: OfferStatus
  created_at: string
}
