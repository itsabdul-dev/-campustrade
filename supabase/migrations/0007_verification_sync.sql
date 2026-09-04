-- Makes the verified badge actually turn on.
--
-- handle_new_user sets `verified` from email_confirmed_at at the moment the
-- account row is created — which is always before the email has been confirmed,
-- so it is always false. Nothing ever set it afterwards, so every real member
-- stayed "Not verified yet" forever, including after clicking their sign-in
-- link. Since 0006 correctly stops members setting the flag themselves, it has
-- to be maintained here.

create or replace function sync_profile_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null
     and (old.email_confirmed_at is null
          or old.email_confirmed_at is distinct from new.email_confirmed_at) then
    update public.profiles
       set verified = true,
           university = coalesce(
             nullif(university, ''),
             split_part(new.email, '@', 2)
           )
     where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function sync_profile_verification();

-- Backfill everyone who confirmed before this trigger existed.
update public.profiles p
   set verified = true
  from auth.users u
 where u.id = p.id
   and u.email_confirmed_at is not null
   and p.verified = false;
