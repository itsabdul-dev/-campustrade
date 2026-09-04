-- Reviews, offers, full-text search, and the safety tools (report / block).

-- ---------------------------------------------------------------- reviews

create table reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  reviewer_id uuid not null references profiles on delete cascade,
  subject_id uuid not null references profiles on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null default '' check (length(body) <= 1000),
  created_at timestamptz not null default now(),
  -- One review per person per order, so reputation cannot be farmed.
  unique (order_id, reviewer_id),
  constraint no_self_review check (reviewer_id <> subject_id)
);

create index reviews_subject_idx on reviews (subject_id, created_at desc);

-- profiles.rating and review_count are denormalised so listing cards and
-- profile headers never need an aggregate.
create function sync_profile_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.subject_id, old.subject_id);
begin
  update profiles p
     set rating = coalesce((
           select round(avg(r.rating)::numeric, 1) from reviews r
            where r.subject_id = target
         ), 0),
         review_count = (
           select count(*) from reviews r where r.subject_id = target
         )
   where p.id = target;
  return null;
end;
$$;

create trigger on_review_change
  after insert or update or delete on reviews
  for each row execute function sync_profile_rating();

-- ----------------------------------------------------------------- offers

create type offer_status as enum ('pending', 'accepted', 'declined', 'withdrawn');

create table offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings on delete cascade,
  conversation_id uuid references conversations on delete set null,
  buyer_id uuid not null references profiles on delete cascade,
  seller_id uuid not null references profiles on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  status offer_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint offer_parties_differ check (buyer_id <> seller_id)
);

create index offers_listing_idx on offers (listing_id, status);
create index offers_parties_idx on offers (buyer_id, seller_id, created_at desc);

-- ------------------------------------------------------ full-text search

alter table listings add column search_vector tsvector;

create function listings_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.location, '')), 'C');
  return new;
end;
$$;

create trigger on_listing_search
  before insert or update of title, description, location on listings
  for each row execute function listings_search_vector();

create index listings_search_idx on listings using gin (search_vector);

-- Backfill rows that already exist.
update listings set title = title;

-- --------------------------------------------------------- report / block

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles on delete cascade,
  subject_kind text not null check (subject_kind in ('listing', 'post', 'profile', 'message')),
  subject_id uuid not null,
  reason text not null,
  detail text not null default '',
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (reporter_id, subject_kind, subject_id)
);

create table blocks (
  blocker_id uuid not null references profiles on delete cascade,
  blocked_id uuid not null references profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

-- ---------------------------------------------------------------- RLS

alter table reviews enable row level security;
alter table offers enable row level security;
alter table reports enable row level security;
alter table blocks enable row level security;

-- Reviews are public reputation; you may only write one about the other party
-- of an order you were actually part of.
create policy "reviews are readable by members"
  on reviews for select to authenticated using (true);

create policy "order parties write reviews"
  on reviews for insert to authenticated
  with check (
    reviewer_id = (select auth.uid())
    and exists (
      select 1 from orders o
       where o.id = reviews.order_id
         and o.status = 'completed'
         and (
           (o.buyer_id = (select auth.uid()) and o.seller_id = reviews.subject_id)
           or (o.seller_id = (select auth.uid()) and o.buyer_id = reviews.subject_id)
         )
    )
  );

create policy "reviewers edit own reviews"
  on reviews for update to authenticated
  using (reviewer_id = (select auth.uid()))
  with check (reviewer_id = (select auth.uid()));

-- Offers are visible to the two parties.
create policy "offer parties read offers"
  on offers for select to authenticated
  using (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()));

create policy "buyers make offers"
  on offers for insert to authenticated
  with check (buyer_id = (select auth.uid()));

create policy "offer parties update offers"
  on offers for update to authenticated
  using (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()))
  with check (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()));

-- A report is write-only from the member's side: you can file one and see your
-- own, but not read anyone else's.
create policy "members read own reports"
  on reports for select to authenticated
  using (reporter_id = (select auth.uid()));

create policy "members file reports"
  on reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));

create policy "members read own blocks"
  on blocks for select to authenticated
  using (blocker_id = (select auth.uid()));

create policy "members block as themselves"
  on blocks for insert to authenticated
  with check (blocker_id = (select auth.uid()));

create policy "members unblock"
  on blocks for delete to authenticated
  using (blocker_id = (select auth.uid()));

-- Notify the seller of a new offer, and the buyer of the answer.
create function notify_offer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into notifications (profile_id, kind, title, body, link)
    values (new.seller_id, 'offer', 'New offer received',
            'Someone offered R' || new.amount || ' on your listing.', '/inbox');
  elsif new.status <> old.status and new.status in ('accepted', 'declined') then
    insert into notifications (profile_id, kind, title, body, link)
    values (new.buyer_id, 'offer',
            'Offer ' || new.status,
            'Your offer of R' || new.amount || ' was ' || new.status || '.', '/inbox');
  end if;
  return new;
end;
$$;

create trigger on_offer_change
  after insert or update on offers
  for each row execute function notify_offer();

-- The bell needs live delivery, and offers appear inside the chat thread.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table notifications;
    alter publication supabase_realtime add table offers;
  end if;
end $$;
