# Deploying CampusTrade

The app is a static single-page build. Vercel serves `dist/`, and the browser
talks to Supabase directly — there is no server of our own.

## 1. Push to GitHub

The repository is already initialised and committed locally. Create an **empty
private** repo at https://github.com/new — no README, no .gitignore, no licence
— then:

```bash
git remote add origin https://github.com/<you>/campustrade.git
git branch -M main
git push -u origin main
```

## 2. Import into Vercel

1. Sign in at https://vercel.com with GitHub.
2. **Add New → Project**, pick the repo, **Import**.
3. Vercel detects Vite. Leave the defaults:
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
4. Before clicking Deploy, open **Environment Variables** and add both:

   | Name | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | your project URL |
   | `VITE_SUPABASE_ANON_KEY` | your anon public key |

   Take them from `.env.local`. Add them to **all three** environments
   (Production, Preview, Development).

   These are compiled into the JavaScript bundle at build time, which is fine —
   the anon key is designed to be public, and row level security is what
   protects the data. Never add the `service_role` key.

5. **Deploy.**

If you forget the variables, the build still succeeds and the app loads on
fixtures, because `isSupabaseConfigured` is false. That is the intended
fallback, but it means a missing variable looks like working software — check
that real listings appear.

## 3. Tell Supabase about the new address

This is the step people miss, and sign-in breaks without it.

**Supabase → Authentication → URL Configuration:**

- **Site URL:** `https://<your-app>.vercel.app`
- **Redirect URLs:** add both
  - `https://<your-app>.vercel.app/**`
  - `http://localhost:5173/**` (keep, so local development still works)

The `/**` wildcard matters: sign-in redirects to `/explore`, and an exact-match
entry would reject it.

Vercel also gives every branch a preview URL. To sign in on those, add
`https://*-<your-account>.vercel.app/**` as well.

## 4. Check it worked

On the live URL:

1. Listings load — if you see Thabo Mokoena and the seeded items, Supabase is
   connected. A polished but empty marketplace means the env vars did not apply.
2. Sign in with a password account (no email needed):
   `thabo@demo.mycput.ac.za` / `campustrade-demo`
3. Request a magic link and open it — this is what proves step 3.
4. **Refresh the page while on `/explore`.** If that 404s, `vercel.json` did not
   apply. It is what tells Vercel to hand every path to `index.html` instead of
   looking for a file that does not exist.
5. Open it on a real phone.

## 5. Before you show anyone

- **Email limits.** Supabase's built-in mailer allows only a few messages an
  hour, and sign-in links are the main way in. Connect real SMTP under
  **Authentication → Emails** (Brevo and Resend have free tiers), or tell your
  marker to use the demo password account above.
- **Reports go nowhere.** Members can report listings and profiles, and nobody
  reads the queue. Check `select * from reports where resolved = false` now and
  then, or say in your write-up that moderation is out of scope.

## Later changes

`git push` to `main` redeploys automatically. Editing `tailwind.config.js`
needs a local dev-server restart, but Vercel builds fresh every time so it is
never an issue there.
