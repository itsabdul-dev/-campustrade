-- Lets a member remove a message they sent.
--
-- Without a delete policy the row silently survives: PostgREST reports success
-- because zero rows matched the policy, so an "unsend" would appear to work
-- and change nothing.

create policy "senders delete own messages"
  on messages for delete to authenticated
  using (sender_id = (select auth.uid()));
