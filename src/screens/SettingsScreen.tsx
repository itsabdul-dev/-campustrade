import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  ChevronRight,
  FileText,
  KeyRound,
  Monitor,
  Scale,
  Sun,
  MapPin,
  Moon,
  ShieldCheck,
} from 'lucide-react'
import { PageBody, PageHeader } from '../layout/Page'
import { useTheme } from '../data/ThemeProvider'
import PasswordSettings from '../components/PasswordSettings'
import { Notice, Toggle } from '../components/ui'

const toggles = [
  {
    icon: Bell,
    title: 'Push Notifications',
    body: 'Alerts, sounds and badges',
    on: true,
    key: 'campustrade.pref.push',
  },
  {
    icon: MapPin,
    title: 'Location Services',
    body: 'Location-based personalization',
    on: true,
    key: 'campustrade.pref.location',
  },
]

const links = [
  {
    icon: KeyRound,
    title: 'Password',
    body: 'Set a password as an alternative to email links',
  },
  {
    icon: ShieldCheck,
    title: 'Two-Factor Authentication (2FA)',
    body: 'Add an extra layer of security',
  },
  {
    icon: FileText,
    title: 'Data Privacy & POPIA Compliance',
    body: 'Manage your personal information',
  },
]

const details: Record<string, string> = {
  'Two-Factor Authentication (2FA)':
    'Sign-in uses an email address and a password. An authenticator app option is planned for high-value sellers.',
  'Data Privacy & POPIA Compliance':
    'We store your name, email address and listing activity. Data stays in the project region, is never sold, and you may request export or deletion at any time.',
}

export default function SettingsScreen() {
  const { choice, resolved, setChoice } = useTheme()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [passwordOpen, setPasswordOpen] = useState(false)

  return (
    <>
      <PageHeader title="Account Settings" back />

      <PageBody>
        <p className="eyebrow">Appearance</p>
        <div className="card mt-3 p-4 lg:p-5">
          <div className="flex items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-500">
              <Moon size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold">Theme</h3>
              <p className="mt-0.5 text-sm text-ink-muted">
                {choice === 'system'
                  ? `Following your device — currently ${resolved}`
                  : `Always ${choice}`}
              </p>
            </div>
          </div>

          <div
            role="radiogroup"
            aria-label="Theme"
            className="mt-4 flex gap-1 rounded-full bg-surface-sunken p-1"
          >
            {(
              [
                ['light', 'Light', Sun],
                ['dark', 'Dark', Moon],
                ['system', 'System', Monitor],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={choice === key}
                onClick={() => setChoice(key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                  choice === key
                    ? 'bg-surface text-brand-500 shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="eyebrow mt-8">Profile &amp; Preferences</p>
        <div className="card mt-3 divide-y divide-line">
          {toggles.map(({ icon: Icon, title, body, on, key }) => (
            <div key={title} className="flex items-center gap-4 px-4 py-4 lg:px-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-500">
                <Icon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold">{title}</h3>
                <p className="mt-0.5 text-sm text-ink-muted">{body}</p>
              </div>
              <Toggle defaultOn={on} storageKey={key} label={title} />
            </div>
          ))}
        </div>

        <p className="eyebrow mt-8">Security &amp; Compliance</p>
        <div className="card mt-3 divide-y divide-line">
          {links.map(({ icon: Icon, title, body }) => (
            <button
              key={title}
              type="button"
              onClick={() =>
                title === 'Password'
                  ? setPasswordOpen(true)
                  : setExpanded(expanded === title ? null : title)
              }
              aria-expanded={expanded === title}
              className="flex w-full items-center gap-4 px-4 py-4 text-left transition first:rounded-t-card last:rounded-b-card hover:bg-surface-sunken lg:px-5"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-500">
                <Icon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold">{title}</h3>
                <p className="mt-0.5 text-sm text-ink-muted">{body}</p>
              </div>
              <ChevronRight
                size={20}
                className={`text-ink-faint transition ${
                  expanded === title ? 'rotate-90' : ''
                }`}
              />
            </button>
          ))}

          {expanded && (
            <div className="px-4 py-4 lg:px-5">
              <Notice title={expanded}>{details[expanded]}</Notice>
            </div>
          )}
        </div>

        <PasswordSettings
          open={passwordOpen}
          onClose={() => setPasswordOpen(false)}
        />

        <p className="eyebrow mt-8">Legal</p>
        <div className="card mt-3 divide-y divide-line">
          {[
            ['/terms', 'Terms of Service'],
            ['/privacy', 'Privacy Notice & POPIA'],
            ['/about', 'About this project'],
          ].map(([to, label]) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-4 px-4 py-4 transition first:rounded-t-card last:rounded-b-card hover:bg-surface-sunken lg:px-5"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-sunken text-ink-soft">
                <Scale size={19} />
              </span>
              <span className="flex-1 font-bold">{label}</span>
              <ChevronRight size={20} className="text-ink-faint" />
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-ink-muted">Version 2.4.1 (Build 1092)</p>
          <p className="eyebrow mt-1">Student project · no real payments</p>
        </div>
      </PageBody>
    </>
  )
}
