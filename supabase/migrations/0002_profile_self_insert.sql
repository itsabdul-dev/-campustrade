-- Lets a signed-in member create their own profile row.
--
-- handle_new_user covers the normal sign-up path, but accounts that existed
-- before the schema was installed have no profile, and without an insert
-- policy the client cannot heal that: the session is valid while every query
-- behaves as though the user does not exist.

create policy "members create own profile"
  on profiles for insert to authenticated
  with check (id = (select auth.uid()));
