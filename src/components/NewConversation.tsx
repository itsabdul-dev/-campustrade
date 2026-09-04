import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { openConversation } from '../data/api'
import { useAuth } from '../data/AuthProvider'
import { useDirectory } from '../data/hooks'
import { Avatar, VerifiedTick } from './ui'
import Sheet from './Sheet'

export default function NewConversation({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const { profile, demo } = useAuth()
  const { data: people, loading } = useDirectory()
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const visible = people.filter((p) =>
    p.full_name.toLowerCase().includes(query.toLowerCase()),
  )

  const start = async (otherId: string) => {
    if (demo || !profile) {
      onClose()
      navigate('/inbox')
      return
    }
    setBusy(otherId)
    try {
      const id = await openConversation(profile.id, otherId)
      onClose()
      navigate(`/inbox/${id}`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="New message">
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members..."
          aria-label="Search members"
          className="field rounded-full bg-surface-sunken pl-11"
        />
      </div>

      {loading && (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-field bg-line/50" />
          ))}
        </div>
      )}

      {!loading && visible.length === 0 && (
        <p className="py-10 text-center text-[15px] text-ink-muted">
          No members match that search.
        </p>
      )}

      <ul className="mt-4 space-y-1">
        {visible.map((person) => (
          <li key={person.id}>
            <button
              onClick={() => void start(person.id)}
              disabled={busy === person.id}
              className="flex w-full items-center gap-3 rounded-field p-3 text-left transition hover:bg-surface-sunken"
            >
              <Avatar
                src={person.avatar_url}
                alt={person.full_name}
                size={44}
                online={person.online}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-bold">{person.full_name}</span>
                  {person.verified && <VerifiedTick />}
                </span>
                <span className="mt-0.5 block text-sm text-ink-muted">
                  {person.university || 'Campus member'}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
