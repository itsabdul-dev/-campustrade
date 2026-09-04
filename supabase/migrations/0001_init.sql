-- CampusTrade schema.
-- Mirrors the shapes in src/data/types.ts.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums

create type user_role as enum ('student', 'faculty', 'vendor', 'resident');

create type listing_condition as enum ('new', 'like_new', 'excellent', 'good', 'fair');

create type listing_category as enum (
  'textbooks', 'electronics', 'services', 'furniture', 'housing'
);

create type listing_status as enum ('draft', 'active', 'sold', 'withdrawn');

create type order_status as enum (
  'placed', 'in_escrow', 'in_transit', 'ready_for_pickup', 'completed', 'cancelled'
);

create type post_category as enum ('events', 'sustainability', 'general');

-- ---------------------------------------------------------------- profiles

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  avatar_url text,
  role user_role not null default 'student',
  university text not null default '',
  verified boolean not null default false,
  rating numeric(2, 1) not null default 0 check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on column profiles.verified is
  'True once the university email has been confirmed. Set by the handle_new_user trigger.';

-- A profile row is created for every new auth user, so the app never has to
-- deal with a signed-in user that has no profile.
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, university, verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'university', split_part(new.email, '@', 2)),
    new.email_confirmed_at is not null
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------- listings

create table listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles on delete cascade,
  title text not null check (length(title) between 3 and 140),
  description text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  category listing_category not null,
  condition listing_condition not null,
  status listing_status not null default 'active',
  location text not null default '',
  image_urls text[] not null default '{}',
  rating numeric(2, 1) not null default 0 check (rating between 0 and 5),
  created_at timestamptz not null default now()
);

create index listings_browse_idx on listings (status, category, created_at desc);
create index listings_seller_idx on listings (seller_id);

-- ---------------------------------------------------------------- orders

create table orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default 'TRX-' || lpad((floor(random() * 100000))::text, 5, '0'),
  listing_id uuid references listings on delete set null,
  buyer_id uuid not null references profiles on delete cascade,
  seller_id uuid not null references profiles on delete cascade,
  listing_title text not null,
  image_url text,
  amount numeric(10, 2) not null check (amount >= 0),
  escrow_fee numeric(10, 2) not null default 5.00,
  status order_status not null default 'placed',
  meetup_label text,
  meetup_address text,
  placed_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint buyer_is_not_seller check (buyer_id <> seller_id)
);

create index orders_buyer_idx on orders (buyer_id, status, placed_at desc);
create index orders_seller_idx on orders (seller_id, status, placed_at desc);

-- The escrow timeline behind the Track Order screen.
create table order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  status order_status not null,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now()
);

create index order_events_order_idx on order_events (order_id, created_at);

-- ---------------------------------------------------------------- messaging

create table conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings on delete set null,
  is_group boolean not null default false,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table conversation_participants (
  conversation_id uuid not null references conversations on delete cascade,
  profile_id uuid not null references profiles on delete cascade,
  last_read_at timestamptz not null default 'epoch',
  primary key (conversation_id, profile_id)
);

create index conversation_participants_profile_idx
  on conversation_participants (profile_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations on delete cascade,
  sender_id uuid not null references profiles on delete cascade,
  body text not null check (length(body) between 1 and 4000),
  sent_at timestamptz not null default now()
);

create index messages_conversation_idx on messages (conversation_id, sent_at);

create function touch_conversation()
returns trigger
language plpgsql
as $$
begin
  update conversations
     set last_message_at = new.sent_at
   where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_sent
  after insert on messages
  for each row execute function touch_conversation();

-- Membership test used by the messaging policies. SECURITY DEFINER keeps the
-- policy on conversation_participants from recursing into itself.
create function is_conversation_member(target uuid, who uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants
     where conversation_id = target and profile_id = who
  );
$$;

-- ---------------------------------------------------------------- community

create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles on delete cascade,
  author_badge text not null default '',
  category post_category not null default 'general',
  title text not null,
  body text not null default '',
  image_url text,
  comment_count integer not null default 0 check (comment_count >= 0),
  created_at timestamptz not null default now()
);

create index posts_feed_idx on posts (category, created_at desc);

create table post_likes (
  post_id uuid not null references posts on delete cascade,
  profile_id uuid not null references profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

-- ---------------------------------------------------------------- RLS

alter table profiles enable row level security;
alter table listings enable row level security;
alter table orders enable row level security;
alter table order_events enable row level security;
alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;
alter table posts enable row level security;
alter table post_likes enable row level security;

-- Profiles are public within the signed-in community; you may only edit yours.
create policy "profiles are readable by members"
  on profiles for select to authenticated using (true);

create policy "own profile is updatable"
  on profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Listings: everyone sees active ones, sellers manage their own.
create policy "active listings are readable"
  on listings for select to authenticated
  using (status = 'active' or seller_id = (select auth.uid()));

create policy "sellers insert own listings"
  on listings for insert to authenticated
  with check (seller_id = (select auth.uid()));

create policy "sellers update own listings"
  on listings for update to authenticated
  using (seller_id = (select auth.uid())) with check (seller_id = (select auth.uid()));

create policy "sellers delete own listings"
  on listings for delete to authenticated
  using (seller_id = (select auth.uid()));

-- Orders are visible to their two parties only.
create policy "order parties read orders"
  on orders for select to authenticated
  using (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()));

create policy "buyers create orders"
  on orders for insert to authenticated
  with check (buyer_id = (select auth.uid()));

create policy "order parties update orders"
  on orders for update to authenticated
  using (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()))
  with check (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()));

create policy "order parties read events"
  on order_events for select to authenticated
  using (
    exists (
      select 1 from orders o
       where o.id = order_events.order_id
         and (o.buyer_id = (select auth.uid()) or o.seller_id = (select auth.uid()))
    )
  );

-- Messaging is scoped to conversation membership.
create policy "members read conversations"
  on conversations for select to authenticated
  using (is_conversation_member(id, (select auth.uid())));

create policy "members create conversations"
  on conversations for insert to authenticated with check (true);

create policy "members read participants"
  on conversation_participants for select to authenticated
  using (is_conversation_member(conversation_id, (select auth.uid())));

create policy "members add participants"
  on conversation_participants for insert to authenticated
  with check (
    profile_id = (select auth.uid())
    or is_conversation_member(conversation_id, (select auth.uid()))
  );

create policy "members update own read marker"
  on conversation_participants for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "members read messages"
  on messages for select to authenticated
  using (is_conversation_member(conversation_id, (select auth.uid())));

create policy "members send messages"
  on messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and is_conversation_member(conversation_id, (select auth.uid()))
  );

-- The campus feed is readable by all members; authors manage their own posts.
create policy "posts are readable by members"
  on posts for select to authenticated using (true);

create policy "authors insert own posts"
  on posts for insert to authenticated
  with check (author_id = (select auth.uid()));

create policy "authors update own posts"
  on posts for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));

create policy "authors delete own posts"
  on posts for delete to authenticated
  using (author_id = (select auth.uid()));

create policy "likes are readable by members"
  on post_likes for select to authenticated using (true);

create policy "members like as themselves"
  on post_likes for insert to authenticated
  with check (profile_id = (select auth.uid()));

create policy "members remove own likes"
  on post_likes for delete to authenticated
  using (profile_id = (select auth.uid()));

-- ---------------------------------------------------------------- realtime

-- The chat thread subscribes to message inserts. Postgres changes are only
-- broadcast for tables in this publication, and the guard keeps the migration
-- runnable on a plain Postgres where the publication does not exist.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table messages;
  end if;
end $$;
