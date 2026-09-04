# CampusTrade

A verified campus marketplace for university students — buy, sell, and trade
within your own institution, with every payment held in escrow until the item
is handed over.

Built from the Visily mobile designs. Every screen is one responsive component:
the phone layout is the mobile design, and the same component re-lays out for
desktop rather than being stretched.

## Running it

```bash
npm install
npm run dev
```

## Stack

- React 19 + TypeScript, built with Vite
- Tailwind CSS for styling, with the design tokens in `tailwind.config.js`
- React Router for navigation
- lucide-react for icons

## Theming

Light and dark are both first-class, chosen in Settings → Appearance as
**Light**, **Dark** or **System** (which follows the OS and updates live).

Every colour resolves through a CSS variable holding a space-separated RGB
triple, declared once in `src/index.css`: `:root` for light, `.dark` for the
overrides. `tailwind.config.js` maps each design token to
`rgb(var(--token) / <alpha-value>)`, so opacity modifiers still work
(`bg-brand-500/10`) and a theme swap is a variable change rather than a
`dark:` variant on every element.

Notes worth keeping:

- **`--on-brand`** is the foreground for anything filled with `--brand-500`.
  The brand violet lightens in dark mode for legibility against the page, which
  drops white text on it to about 3.3:1 — so dark mode puts near-black on that
  fill instead, reaching about 5.9:1.
- **Semantic tints** (`positive`, `warning`, `danger`) each have a `soft` wash
  and a base for text, rather than hard-coded Tailwind palette steps that only
  read correctly on white.
- **Overlay pills** that sit on photographs use `bg-surface`, not `bg-white` —
  their text is `ink`, which inverts, so a fixed white pill left white text on
  white.
- **An inline script in `index.html`** applies the stored theme before first
  paint, so a dark-theme reload never flashes white.
- Both themes were measured against WCAG AA (4.5:1 body, 3:1 large) across all
  nine screens. Fixing dark exposed several pre-existing light-mode failures in
  muted text and badge colours, which were corrected at the same time.

## Layout approach

`src/layout/AppShell.tsx` holds the single navigation model. Below `lg` it
renders the bottom tab bar from the designs; from `lg` up the same items become
a persistent left sidebar. The designs used five different bottom bars across
screens, so these were unified into one: Explore, Community, Sell, Orders,
Inbox, with Account reachable from the header avatar on mobile and the sidebar
footer on desktop.

Screens adapt in three ways:

- **Grids widen.** Listings go from 2 columns on a phone to 4 on desktop.
- **Sections become rails.** Checkout's order summary, Track Order's seller
  card, and Explore's bulletin board move into a sticky right-hand column.
- **Stacks become panes.** The inbox renders list-then-thread on mobile and
  list-beside-thread on desktop, driven by `useMediaQuery`.

## Screens

| Route | Screen |
| --- | --- |
| `/` | Splash |
| `/onboarding` | Onboarding carousel |
| `/signup` | Create Account |
| `/explore` | Home / marketplace |
| `/community` | Campus feed |
| `/sell` | Create Listing |
| `/checkout` | Complete Checkout |
| `/orders` | Transactions, with the escrow release dialog |
| `/orders/track` | Track Order |
| `/inbox`, `/inbox/:id` | Messages and chat thread |
| `/account` | Profile |
| `/settings` | Account Settings |

## Supabase

The app runs in two modes, decided by whether credentials are present:

- **No credentials** — every hook resolves the fixtures in `src/data/mock.ts`,
  the auth gate is open, and writes are skipped. The whole UI stays browsable.
- **Credentials set** — hooks query Supabase, routes require a signed-in
  member, and writes persist.

### Connecting a project

1. Create a project at [supabase.com](https://supabase.com) (this needs your
   own account — the dashboard is where the keys live).
2. Copy `.env.example` to `.env.local` and fill in **Project URL** and the
   **anon public** key from Settings → API. The anon key is browser-safe;
   row level security is what protects the data. Never put the `service_role`
   key in this file.
3. Run `supabase/migrations/0001_init.sql` in the SQL editor.
4. Restart `npm run dev` — Vite only reads env at startup.
5. Optionally sign up two accounts, then run `supabase/seed.sql` for demo data.

### Schema

`supabase/migrations/0001_init.sql` creates nine tables — `profiles`,
`listings`, `orders`, `order_events`, `conversations`,
`conversation_participants`, `messages`, `posts`, `post_likes` — with enums for
roles, categories, conditions and order status.

Row level security is on for every table:

- Profiles and posts are readable by any signed-in member; you may only edit
  your own.
- Listings are readable when `active`, and writable only by their seller.
- Orders and their timeline events are visible only to the buyer and seller.
- Conversations and messages are scoped to membership, checked through the
  `is_conversation_member` SECURITY DEFINER function so the participants policy
  does not recurse into itself.

Two triggers keep things consistent: `handle_new_user` creates a profile row
for every new auth user, and `touch_conversation` maintains
`conversations.last_message_at` for inbox ordering.

### Auth

The default is a magic link (`signInWithOtp`): the university email is the
credential, which is what makes the address check meaningful.

A password is optional. It can be set at sign-up or later from Settings →
Password, and either method then works from the sign-in screen. Passwords are
handled entirely by Supabase Auth — the app never stores one.

### Reviews

`reviews` is keyed on `(order_id, reviewer_id)`, so a member can leave exactly
one review per order and only for an order they were part of that has actually
completed — the insert policy checks this rather than trusting the client. A
trigger recomputes `profiles.rating` and `profiles.review_count`, so listing
cards and profile headers never run an aggregate.

### Offers

An offer belongs to a listing and a conversation. The seller is notified on
arrival and the buyer on the answer, both by trigger. Accepting an offer does
not move money: the buyer adds the item to their basket at the agreed price and
the normal escrow checkout runs from there.

### Search

`listings.search_vector` is a weighted `tsvector` over title (A), description
(B) and location (C), maintained by trigger and indexed with GIN. The Explore
input is debounced by 300ms and queries Postgres with `websearch` syntax, so
quoted phrases and `-exclusions` work.

### Safety

Reports are write-only from the member's side: you can file one and read your
own, never anyone else's. Blocking is enforced client-side, because a listing
stays publicly readable — the point is that the blocker stops seeing them.

### Layers

| File | Role |
| --- | --- |
| `src/lib/supabase.ts` | Client, plus the `isSupabaseConfigured` flag |
| `src/lib/database.types.ts` | Schema types, mirroring the migration |
| `src/data/api.ts` | Queries, and mapping rows to app types |
| `src/data/hooks.ts` | React hooks with the fixture fallback |
| `src/data/AuthProvider.tsx` | Session, profile, sign-in/out |
| `src/data/mock.ts` | Fixtures |

`database.types.ts` is hand-written to match the migration. Once the project
exists it can be regenerated instead:

```bash
npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
```

Note that its row types must stay **type aliases, not interfaces** — Supabase
constrains schemas to `Record<string, unknown>`, and interfaces have no
implicit index signature, so an interface silently collapses every table to
`never`.

### Migrations

Run them in order in the SQL editor:

| File | Adds |
| --- | --- |
| `0001_init.sql` | Core schema, RLS, triggers, realtime |
| `0002_profile_self_insert.sql` | Lets a member create their own profile row |
| `0003_storage_and_features.sql` | Image bucket, comments, saves, notifications |
| `0004_message_deletion.sql` | Lets a member delete a message they sent |
| `0005_reviews_offers_safety.sql` | Reviews, offers, full-text search, report/block |

### Seed data

`supabase/seed.sql` is self-contained — it creates five demo members and fills
the marketplace, feed, orders and inbox, so every screen has something real to
show. It clears its own demo rows first, so it is safe to re-run, and it leaves
accounts you signed up yourself alone.

The demo accounts sign in with the password `campustrade-demo`. They exist for
development only; do not run the seed against a production project.

Then run `supabase/seed_me.sql`, changing the email at the top to your own.
Orders and conversations are scoped by RLS to the people in them, so the main
seed leaves your own Orders and Inbox empty — this file gives your account its
own orders, a conversation and notifications.

### What is live

Every screen reads and writes real data: browsing, filtering and sorting
listings; listing detail with save-for-later; basket and escrow checkout that
creates orders; escrow release; the Track Order timeline; conversations,
messages and realtime delivery; starting a new conversation; the campus feed
with posts, likes and comments; notifications; profile and per-device
preferences; and image upload to Supabase Storage.

## Performance

Three things made screens feel slow, and they had different causes:

1. **React StrictMode double-fetches in development.** Every effect runs twice,
   so `/inbox` made 16 requests in dev and 8 in a production build. This is a
   dev-only behaviour and disappears when built.
2. **No caching.** Every navigation refetched from scratch, so returning to a
   screen you had just left showed skeletons again. `src/data/queryCache.ts`
   now holds results at module level (surviving unmount, which is the point).
   A revisit renders from cache immediately and refreshes in the background —
   0 requests and ~10ms instead of ~1s.
3. **Round-trip latency.** A trivial `select id limit 1` against the project
   takes about 350ms, so cost is dominated by the *number* of requests, not the
   work in them. `fetchBadges` and `fetchConversations` each make several
   sequential hops and are the best candidates if more is needed — a Postgres
   function returning one row would collapse them into a single trip.

Writes call `invalidate()` with the query names they affect, so the screen
showing the thing you just changed refetches rather than serving a copy taken
before the change.

## Data shapes

`src/data/types.ts` defines what components consume. `api.ts` maps database
rows onto those shapes, so a schema change is absorbed in one file.

Photography is loaded from Unsplash. The `Img` component fades images in over a
gradient placeholder so a slow or blocked request still renders as a deliberate
surface.
