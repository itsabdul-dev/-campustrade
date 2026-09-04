# CampusTrade — pre-launch checklist

Findings from a full audit against the live Supabase project. Ordered by what
would hurt most if it shipped as-is.

---

## Blockers

### 1. No money actually moves

The app says "Secure Escrow", "Proceed to Secure Payment", "Funds are held
safely until delivery is confirmed", and charges a R5.00 escrow fee. None of
that happens. There is no PayFast or SnapScan integration; `placeOrders` writes
rows and nothing else.

Telling students their money is protected when no money is held is the single
most serious problem here, and it is a claim about other people's cash rather
than a missing feature.

Pick one before real students use it:

- **Demo framing (recommended for a university project).** Add a persistent
  banner — "Demo project. No real payments are processed." — and change
  "Proceed to Secure Payment" to "Confirm Trade (Demo)".
- **Real payments.** Integrate PayFast properly. Escrow means holding funds on
  behalf of two parties, which in South Africa is a regulated activity. Do not
  attempt this for a course project.

### 2. Run migration `0006_harden_write_access.sql`

I found five write paths open to anyone with a signed-in session and the
browser console. The anon key is public by design, so these were reachable by
any student. Verified by exploiting each one:

| Hole | What I did |
| --- | --- |
| Self-set reputation | Set my own rating to 5.0 with 999 reviews |
| Self-verify | Marked myself verified and changed my role to vendor |
| Seller self-release | Completed my own sale, releasing escrow with no buyer |
| Amount tampering | Changed an order's amount to R0.01 |
| Notification spoofing | Wrote a notification into another member's feed |

Every change was reverted after testing. `0006` closes all five with column
grants and a trigger, and additionally makes blocking hold server-side —
previously a blocked member could still message you, you just could not see it.

### 3. Legal pages are links to nowhere

Sign-up says "you agree to CampusTrade's Terms of Service and Privacy Policy".
Both are `href="#"`. Settings claims POPIA compliance.

POPIA is real South African law and you are processing student names, emails
and location data. You need at minimum a privacy notice saying what you collect,
why, how long you keep it, and how to request deletion.

---

## Should fix before launch

### 4. Nobody is reading the reports

Members can report listings and profiles. The rows land in `reports` and no
person or process ever looks at them. Decide who moderates, and give them a way
to see the queue — even a saved SQL query.

### 5. Email deliverability

Supabase's built-in email service is rate-limited to a few messages per hour
and is not meant for production. Sign-in links are the primary auth method, so
this is a hard cap on how many students can join. Connect real SMTP under
Authentication → Emails.

### 6. Nothing is deployed

The app only runs on `localhost:5173`. You need a host (Vercel or Netlify both
work; `npm run build` outputs `dist/`), the two `VITE_` variables set there, and
that URL added to Supabase → Authentication → URL Configuration. Sign-in links
will not work until the deployed origin is in the redirect allow list.

### 7. No image moderation or size limits in the UI

The bucket caps uploads at 5MB and restricts MIME types, but the app does not
check before upload, so a large file fails with a raw Supabase error. There is
also no way to remove an inappropriate photo other than deleting the listing.

---

## Worth doing

- **Bundle is 612KB (171KB gzipped)** in one chunk. Fine on wifi, slow on
  campus 3G. Route-level `React.lazy` would cut the first load substantially.
- **`fetchBadges` runs four sequential queries** (~630ms) on every page load.
  Worth turning into a single Postgres function.
- **Search requires all terms.** "textbook psychology" returns nothing because
  no listing has both words. Consider falling back to OR when AND finds nothing.
- **No rate limiting** on listings, messages or offers. One student could post
  a thousand listings.
- **No pagination.** Explore caps at 60 listings and the feed at 30, with no
  way to see more.
- **No analytics or error reporting.** You will not know when it breaks.

---

## Verified working

Full sweep against live data, signed in as a seeded account:

- Auth: magic link, password sign-in, password set, reset, sign-out, route
  protection, and the error path when a token is bad
- Listings: browse, full-text search (quoted phrases and `-exclusions` both
  work), filters, sort, detail, create, withdraw, save
- Orders: buying and selling views, escrow release, tracking timeline
- Offers: make, accept, decline, withdraw, and checkout at the agreed price
- Reviews: create, rating recomputation by trigger, display on profile
- Messaging: threads, send, realtime delivery, read receipts, new conversation
- Community: feed, post, like, comment, share
- Safety: report and block
- Accessibility: no unlabelled controls, no missing alt text, one `h1` per
  page, skip-to-content link, visible focus rings
- Data isolation: messages, orders and notifications are correctly scoped —
  I could not read another member's

## Known gaps in this audit

- `LoadError` is wired into Explore, Orders and Community but I could only
  exercise the error path through auth, not a data query.
- Nothing tested on a real phone — only an emulated 375px viewport.
- No load testing. The largest table has 14 rows.
