/**
 * Hand-written to match supabase/migrations/0001_init.sql. Once the project is
 * live this file can be regenerated instead:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */

export type UserRole = 'student' | 'faculty' | 'vendor' | 'resident'
export type ListingCondition = 'new' | 'like_new' | 'excellent' | 'good' | 'fair'
export type ListingCategoryRow =
  | 'textbooks'
  | 'electronics'
  | 'services'
  | 'furniture'
  | 'housing'
export type ListingStatus = 'draft' | 'active' | 'sold' | 'withdrawn'
export type OrderStatusRow =
  | 'placed'
  | 'in_escrow'
  | 'in_transit'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled'
export type PostCategoryRow = 'events' | 'sustainability' | 'general'
export type OfferStatusRow = 'pending' | 'accepted' | 'declined' | 'withdrawn'

type ProfileRow = {
  id: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  university: string
  verified: boolean
  rating: number
  review_count: number
  last_seen_at: string
  created_at: string
}

type ListingRow = {
  id: string
  seller_id: string
  title: string
  description: string
  price: number
  category: ListingCategoryRow
  condition: ListingCondition
  status: ListingStatus
  location: string
  image_urls: string[]
  rating: number
  search_vector: string | null
  created_at: string
}

type OrderRow = {
  id: string
  reference: string
  listing_id: string | null
  buyer_id: string
  seller_id: string
  listing_title: string
  image_url: string | null
  amount: number
  escrow_fee: number
  status: OrderStatusRow
  meetup_label: string | null
  meetup_address: string | null
  placed_at: string
  completed_at: string | null
}

type OrderEventRow = {
  id: string
  order_id: string
  status: OrderStatusRow
  title: string
  body: string
  created_at: string
}

type ConversationRow = {
  id: string
  listing_id: string | null
  is_group: boolean
  created_at: string
  last_message_at: string
}

type ConversationParticipantRow = {
  conversation_id: string
  profile_id: string
  last_read_at: string
}

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  sent_at: string
}

type PostRow = {
  id: string
  author_id: string
  author_badge: string
  category: PostCategoryRow
  title: string
  body: string
  image_url: string | null
  comment_count: number
  created_at: string
}

type PostLikeRow = {
  post_id: string
  profile_id: string
  created_at: string
}

type PostCommentRow = {
  id: string
  post_id: string
  author_id: string
  body: string
  created_at: string
}

type SavedListingRow = {
  profile_id: string
  listing_id: string
  created_at: string
}

type ReviewRow = {
  id: string
  order_id: string
  reviewer_id: string
  subject_id: string
  rating: number
  body: string
  created_at: string
}

type OfferRow = {
  id: string
  listing_id: string
  conversation_id: string | null
  buyer_id: string
  seller_id: string
  amount: number
  status: OfferStatusRow
  created_at: string
  responded_at: string | null
}

type ReportRow = {
  id: string
  reporter_id: string
  subject_kind: string
  subject_id: string
  reason: string
  detail: string
  resolved: boolean
  created_at: string
}

type BlockRow = {
  blocker_id: string
  blocked_id: string
  created_at: string
}

type NotificationRow = {
  id: string
  profile_id: string
  kind: string
  title: string
  body: string
  link: string | null
  read: boolean
  created_at: string
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow>
      listings: Table<
        ListingRow,
        Omit<ListingRow, 'id' | 'created_at' | 'rating' | 'search_vector'> & {
          id?: string
        }
      >
      orders: Table<
        OrderRow,
        Omit<OrderRow, 'id' | 'reference' | 'placed_at' | 'completed_at'> & {
          id?: string
          reference?: string
        }
      >
      order_events: Table<OrderEventRow>
      conversations: Table<ConversationRow>
      conversation_participants: Table<ConversationParticipantRow>
      messages: Table<
        MessageRow,
        Omit<MessageRow, 'id' | 'sent_at'> & { id?: string }
      >
      posts: Table<PostRow>
      post_likes: Table<PostLikeRow>
      post_comments: Table<
        PostCommentRow,
        Omit<PostCommentRow, 'id' | 'created_at'> & { id?: string }
      >
      saved_listings: Table<SavedListingRow>
      reviews: Table<
        ReviewRow,
        Omit<ReviewRow, 'id' | 'created_at'> & { id?: string }
      >
      offers: Table<
        OfferRow,
        Omit<OfferRow, 'id' | 'created_at' | 'status' | 'responded_at'> & {
          id?: string
          status?: OfferStatusRow
          responded_at?: string | null
        }
      >
      reports: Table<
        ReportRow,
        Omit<ReportRow, 'id' | 'created_at' | 'resolved'> & {
          id?: string
          resolved?: boolean
        }
      >
      blocks: Table<
        BlockRow,
        Omit<BlockRow, 'created_at'> & { created_at?: string }
      >
      notifications: Table<
        NotificationRow,
        Omit<NotificationRow, 'id' | 'created_at' | 'read'> & {
          id?: string
          read?: boolean
        }
      >
    }
    Views: { [_ in never]: never }
    Functions: {
      is_conversation_member: {
        Args: { target: string; who: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
      listing_condition: ListingCondition
      listing_category: ListingCategoryRow
      listing_status: ListingStatus
      order_status: OrderStatusRow
      post_category: PostCategoryRow
      offer_status: OfferStatusRow
    }
    CompositeTypes: { [_ in never]: never }
  }
}
