-- Storage for listing photos, plus the tables behind post comments,
-- saved listings and notifications.

-- ---------------------------------------------------------------- storage

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images', 'listing-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Anyone may view listing photos; a member may only write inside a folder
-- named after their own user id, which is how uploads stay attributable.
create policy "listing images are public"
  on storage.objects for select
  using (bucket_id = 'listing-images');

create policy "members upload own listing images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "members delete own listing images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------- comments

create table post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts on delete cascade,
  author_id uuid not null references profiles on delete cascade,
  body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index post_comments_post_idx on post_comments (post_id, created_at);

-- posts.comment_count is denormalised so the feed does not need a join.
create function sync_comment_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger on_comment_change
  after insert or delete on post_comments
  for each row execute function sync_comment_count();

-- ----------------------------------------------------------- saved listings

create table saved_listings (
  profile_id uuid not null references profiles on delete cascade,
  listing_id uuid not null references listings on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, listing_id)
);

-- ----------------------------------------------------------- notifications

create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_profile_idx
  on notifications (profile_id, read, created_at desc);

-- ---------------------------------------------------------------- RLS

alter table post_comments enable row level security;
alter table saved_listings enable row level security;
alter table notifications enable row level security;

create policy "comments are readable by members"
  on post_comments for select to authenticated using (true);

create policy "authors write own comments"
  on post_comments for insert to authenticated
  with check (author_id = (select auth.uid()));

create policy "authors delete own comments"
  on post_comments for delete to authenticated
  using (author_id = (select auth.uid()));

create policy "members read own saves"
  on saved_listings for select to authenticated
  using (profile_id = (select auth.uid()));

create policy "members save as themselves"
  on saved_listings for insert to authenticated
  with check (profile_id = (select auth.uid()));

create policy "members remove own saves"
  on saved_listings for delete to authenticated
  using (profile_id = (select auth.uid()));

create policy "members read own notifications"
  on notifications for select to authenticated
  using (profile_id = (select auth.uid()));

create policy "members update own notifications"
  on notifications for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "members create notifications"
  on notifications for insert to authenticated with check (true);

-- A seller is told when someone buys, and a buyer when funds are released.
create function notify_order_party()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into notifications (profile_id, kind, title, body, link)
    values (
      new.seller_id, 'order',
      'New order received',
      'Someone bought "' || new.listing_title || '".',
      '/orders'
    );
  elsif new.status = 'completed' and old.status <> 'completed' then
    insert into notifications (profile_id, kind, title, body, link)
    values (
      new.seller_id, 'escrow',
      'Escrow funds released',
      'Payment for "' || new.listing_title || '" has been released to you.',
      '/orders'
    );
  end if;
  return new;
end;
$$;

create trigger on_order_change
  after insert or update on orders
  for each row execute function notify_order_party();
