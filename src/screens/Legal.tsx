import { Link, useLocation } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { Brand } from '../layout/AppShell'

function Shell({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto min-h-[calc(100dvh-2rem)] max-w-3xl px-6 py-10 lg:py-16">
      <Link to="/explore">
        <Brand />
      </Link>

      <h1 className="mt-8 text-[34px] leading-tight lg:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-ink-muted">Last updated {updated}</p>

      <div className="mt-6 rounded-card bg-warning-soft p-4 text-sm text-warning">
        <p className="flex items-center gap-2 font-bold">
          <FlaskConical size={15} /> Student project
        </p>
        <p className="mt-1 opacity-90">
          CampusTrade is coursework built by a student at CPUT. It is not a
          registered business, it processes no payments, and it is not
          affiliated with the university.
        </p>
      </div>

      <div className="prose mt-8 space-y-6 text-[15px] leading-relaxed text-ink-soft [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">
        {children}
      </div>

      <div className="mt-12 flex flex-wrap gap-4 border-t border-line pt-6 text-sm font-semibold">
        <Link to="/terms" className="text-brand-500">
          Terms of Service
        </Link>
        <Link to="/privacy" className="text-brand-500">
          Privacy &amp; POPIA
        </Link>
        <Link to="/about" className="text-brand-500">
          About this project
        </Link>
        <Link to="/explore" className="ml-auto text-ink-muted">
          Back to the app
        </Link>
      </div>
    </main>
  )
}

export function Terms() {
  return (
    <Shell title="Terms of Service" updated="September 2026">
      <h2>What CampusTrade is</h2>
      <p>
        CampusTrade is a student-built marketplace where verified members of a
        university community can list, browse and arrange to trade second-hand
        items. It is a coursework project, provided as-is, with no guarantee of
        availability, and it may be taken offline at any time.
      </p>

      <h2>No payments are processed</h2>
      <p>
        <strong>
          The app simulates payment and escrow. No money is collected, held,
          transferred or refunded at any point.
        </strong>{' '}
        Screens referring to escrow, secure payment, PayFast or SnapScan are
        demonstrations of an intended design, not a live financial service.
        Anything you agree with another member is settled directly between you,
        in person, entirely at your own risk.
      </p>

      <h2>Who may use it</h2>
      <ul>
        <li>You must register with an email address you control.</li>
        <li>You must be 18 or older, or have permission from a guardian.</li>
        <li>One account per person. Do not impersonate anyone.</li>
      </ul>

      <h2>What you may not list</h2>
      <ul>
        <li>Anything illegal, stolen, or that you do not own.</li>
        <li>Weapons, drugs, alcohol, tobacco, or prescription medicines.</li>
        <li>Live animals, or anything requiring a licence to sell.</li>
        <li>Academic work for submission as someone else's, or exam material.</li>
        <li>Counterfeit goods, or anything you cannot legally resell.</li>
      </ul>

      <h2>Meeting other members</h2>
      <p>
        Arrange handovers in public, well-lit campus locations during daylight.
        Bring someone with you if you can. CampusTrade does not vet members
        beyond checking that an email address belongs to the university, and a
        verified badge is not a character reference.
      </p>

      <h2>Your content</h2>
      <p>
        You keep ownership of what you post. By posting you allow CampusTrade to
        display it within the app. Do not post anything you do not have the right
        to share, and do not post other people's personal information.
      </p>

      <h2>Ending your access</h2>
      <p>
        You may stop using the app and request deletion of your account at any
        time. Access may be removed without notice for breaking these terms,
        particularly where another member's safety is involved.
      </p>

      <h2>Liability</h2>
      <p>
        CampusTrade is provided without warranty. The project and its author are
        not liable for any loss, damage, injury or dispute arising from trades
        arranged through the app. Because no payment is processed, there is no
        buyer protection, no refund mechanism, and no dispute resolution service,
        regardless of any wording in the interface.
      </p>
    </Shell>
  )
}

export function Privacy() {
  return (
    <Shell title="Privacy Notice" updated="September 2026">
      <p>
        This notice explains what personal information CampusTrade collects and
        why, as required by the Protection of Personal Information Act 4 of 2013
        (POPIA).
      </p>

      <h2>What is collected</h2>
      <ul>
        <li>
          <strong>Your email address</strong> — used to identify your account
          and, if you ask for it, to send a password reset link.
        </li>
        <li>
          <strong>A display name and optional photo</strong> — shown to other
          members so they know who they are meeting.
        </li>
        <li>
          <strong>Your listings, messages, offers, posts and reviews</strong> —
          the content you choose to create.
        </li>
        <li>
          <strong>Meet-up points you select</strong> — chosen from a fixed list
          of campus locations. The app does not read your device location.
        </li>
      </ul>

      <h2>What is not collected</h2>
      <p>
        No card numbers, bank details, identity numbers or payment information of
        any kind, because the app processes no payments. No advertising or
        third-party tracking.
      </p>

      <h2>Why it is processed</h2>
      <p>
        To operate the marketplace: to show your listings to other members, to
        deliver your messages, to keep reputation scores, and to investigate
        reports about safety or misuse. The lawful basis is your consent, given
        when you create an account, and you may withdraw it by deleting your
        account.
      </p>

      <h2>Who can see it</h2>
      <ul>
        <li>
          <strong>Other signed-in members</strong> see your display name, photo,
          rating, reviews and active listings.
        </li>
        <li>
          <strong>Only the people in a conversation</strong> can read its
          messages. Only the buyer and seller can see an order.
        </li>
        <li>
          <strong>Nobody outside the app.</strong> Your data is not sold, shared
          or used for marketing.
        </li>
      </ul>

      <h2>Where it is stored</h2>
      <p>
        In a Supabase project hosted on infrastructure that may sit outside South
        Africa. Data is encrypted in transit. Access is restricted by row level
        security so members can only reach their own records.
      </p>

      <h2>How long it is kept</h2>
      <p>
        Until you delete your account, or until this project is decommissioned at
        the end of the academic year, whichever comes first.
      </p>

      <h2>Your rights under POPIA</h2>
      <ul>
        <li>Ask what personal information is held about you.</li>
        <li>Correct anything inaccurate — most of it is editable in Settings.</li>
        <li>Request deletion of your account and its content.</li>
        <li>Object to processing, or withdraw consent.</li>
        <li>
          Complain to the Information Regulator of South Africa if you believe
          your rights have been infringed.
        </li>
      </ul>

      <h2>Contact</h2>
      <p>
        Requests go to the student who maintains this project, through the
        university email address on the project submission.
      </p>
    </Shell>
  )
}

export function About() {
  const { pathname } = useLocation()
  return (
    <Shell title="About this project" updated={pathname && 'September 2026'}>
      <h2>What this is</h2>
      <p>
        CampusTrade is a university coursework project: a marketplace where
        students at one institution can buy, sell and trade with each other,
        built to demonstrate a complete product rather than to run a business.
      </p>

      <h2>Why the payments are fake</h2>
      <p>
        Holding money on behalf of a buyer and a seller — escrow — is a regulated
        financial activity in South Africa, and not something a student project
        should attempt. The app therefore <strong>simulates</strong> the payment
        and escrow experience so the full trading journey can be shown and
        assessed, while no money moves and no card details are ever requested.
      </p>
      <p>
        Every payment screen is labelled, and the banner at the top of the app
        never goes away.
      </p>

      <h2>What is real</h2>
      <p>
        Everything else. Accounts, listings, photo
        uploads, search, messaging with live delivery, offers, orders, reviews,
        notifications, reporting and blocking are all backed by a real database
        with access rules enforced server-side.
      </p>

      <h2>Built with</h2>
      <p>
        React, TypeScript, Tailwind CSS and Vite on the front end; Supabase for
        the database, authentication, file storage and realtime updates.
      </p>
    </Shell>
  )
}
