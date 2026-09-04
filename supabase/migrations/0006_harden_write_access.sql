-- Closes five write paths that row level security allowed but the app should
-- not. Each was reachable with nothing but the public anon key and a signed-in
-- session, using the browser console.
--
-- The pattern throughout: RLS decides WHICH ROWS you may touch, but says
-- nothing about WHICH COLUMNS. Anything a member must not set about themselves
-- needs a column grant or a trigger as well as a policy.

-- ------------------------------------------------- 1 & 2. profile integrity
--
-- A member could set their own rating to 5.0 with 999 reviews, mark themselves
-- verified, and promote themselves to vendor. That makes the reputation score
-- and the "VERIFIED VIA CPUT" badge meaningless, which are the two things a
-- buyer relies on before meeting a stranger.
--
-- Column grants are the right tool: the update policy still decides the row,
-- while these decide the fields.

revoke update on profiles from authenticated;
grant update (full_name, avatar_url, last_seen_at) on profiles to authenticated;

-- rating and review_count stay writable by sync_profile_rating, which is
-- SECURITY DEFINER and so runs as the owner.

-- --------------------------------------------- 3 & 4. order and escrow rules

create or replace function enforce_order_rules()
returns trigger
language plpgsql
as $$
begin
  -- The money and the parties are the record. Nobody edits them after the
  -- fact, including the two people involved.
  if new.amount is distinct from old.amount
     or new.escrow_fee is distinct from old.escrow_fee
     or new.buyer_id is distinct from old.buyer_id
     or new.seller_id is distinct from old.seller_id
     or new.reference is distinct from old.reference
     or new.listing_title is distinct from old.listing_title then
    raise exception 'Order amount and parties cannot be changed once placed.';
  end if;

  -- Releasing escrow is the buyer's decision alone. A seller who could
  -- complete their own order could take the money without handing anything
  -- over, which is exactly what escrow exists to prevent.
  if new.status = 'completed' and old.status <> 'completed'
     and (select auth.uid()) <> old.buyer_id then
    raise exception 'Only the buyer can confirm receipt and release funds.';
  end if;

  -- Completed is terminal; it must not be reopened to re-trigger payouts.
  if old.status = 'completed' and new.status <> 'completed' then
    raise exception 'A completed order cannot be reopened.';
  end if;

  return new;
end;
$$;

create trigger on_order_update
  before update on orders
  for each row execute function enforce_order_rules();

-- ------------------------------------------------- 5. notification spoofing
--
-- The insert policy was `with check (true)`, so any member could write a
-- notification into anyone else's feed — a ready-made phishing channel
-- ("Your payment failed, tap here"). Members may now only notify themselves;
-- the genuine cross-member notifications come from notify_order_party and
-- notify_offer, which are SECURITY DEFINER and bypass this.

drop policy if exists "members create notifications" on notifications;

create policy "members notify only themselves"
  on notifications for insert to authenticated
  with check (profile_id = (select auth.uid()));

-- ------------------------------------------------ 6. blocking has real teeth
--
-- Blocking was enforced only in the browser, so a blocked member could still
-- open a conversation and send messages; the blocker simply would not see the
-- thread. This makes the block hold server-side.

create or replace function blocked_between(a uuid, b uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
     where (blocker_id = a and blocked_id = b)
        or (blocker_id = b and blocked_id = a)
  );
$$;

drop policy if exists "members send messages" on messages;

create policy "members send messages"
  on messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and is_conversation_member(conversation_id, (select auth.uid()))
    and not exists (
      select 1
        from conversation_participants cp
       where cp.conversation_id = messages.conversation_id
         and cp.profile_id <> (select auth.uid())
         and blocked_between((select auth.uid()), cp.profile_id)
    )
  );

drop policy if exists "members add participants" on conversation_participants;

create policy "members add participants"
  on conversation_participants for insert to authenticated
  with check (
    (
      profile_id = (select auth.uid())
      or is_conversation_member(conversation_id, (select auth.uid()))
    )
    and not blocked_between((select auth.uid()), profile_id)
  );

-- --------------------------------------------------- 7. listing seller lock
--
-- The insert policy checked seller_id, but the update policy let a seller
-- reassign a listing to someone else.

revoke update on listings from authenticated;
grant update (
  title, description, price, category, condition,
  status, location, image_urls
) on listings to authenticated;
