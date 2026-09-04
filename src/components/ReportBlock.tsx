import { useState, type FormEvent } from 'react'
import { Ban, Flag, ShieldAlert } from 'lucide-react'
import { blockMember, reportContent } from '../data/api'
import { useAuth } from '../data/AuthProvider'
import { Notice } from './ui'
import Sheet from './Sheet'

const reasons = [
  'Scam or fraud',
  'Prohibited item',
  'Harassment or abuse',
  'Misleading listing',
  'Spam',
  'Something else',
]

export default function ReportBlock({
  open,
  onClose,
  subjectKind,
  subjectId,
  subjectName,
  blockable = false,
}: {
  open: boolean
  onClose: () => void
  subjectKind: 'listing' | 'post' | 'profile' | 'message'
  subjectId: string
  subjectName: string
  /** Profiles can also be blocked, which hides them across the app. */
  blockable?: boolean
}) {
  const { profile, demo } = useAuth()
  const [reason, setReason] = useState(reasons[0])
  const [detail, setDetail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<'reported' | 'blocked' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()

    if (demo || !profile) {
      setDone('reported')
      return
    }

    setBusy(true)
    setError(null)
    try {
      await reportContent({
        reporter_id: profile.id,
        subject_kind: subjectKind,
        subject_id: subjectId,
        reason,
        detail: detail.trim(),
      })
      setDone('reported')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the report.')
    } finally {
      setBusy(false)
    }
  }

  const block = async () => {
    if (demo || !profile) {
      setDone('blocked')
      return
    }
    setBusy(true)
    try {
      await blockMember(profile.id, subjectId)
      setDone('blocked')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not block this member.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        setDone(null)
        onClose()
      }}
      title="Report or block"
    >
      {done ? (
        <div className="py-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-positive-soft text-positive">
            <ShieldAlert size={24} />
          </span>
          <h3 className="mt-4 text-xl">
            {done === 'blocked' ? 'Member blocked' : 'Report received'}
          </h3>
          <p className="mt-2 text-[15px] text-ink-soft">
            {done === 'blocked'
              ? `You will no longer see ${subjectName} in conversations or listings.`
              : 'Thanks — our safety team reviews every report. We will not tell them who reported it.'}
          </p>
          <button
            onClick={() => {
              setDone(null)
              onClose()
            }}
            className="btn-primary mt-6 w-full py-3.5"
          >
            Done
          </button>
        </div>
      ) : (
        <>
          <Notice title="Your report is anonymous" icon={<Flag size={18} />}>
            {subjectName} is not told who reported them.
          </Notice>

          <form onSubmit={(e) => void submit(e)} className="mt-6">
            <fieldset>
              <legend className="font-bold">What is wrong?</legend>
              <div className="mt-3 space-y-2">
                {reasons.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setReason(option)}
                    aria-pressed={reason === option}
                    className={`flex w-full items-center gap-3 rounded-field border px-4 py-3 text-left text-[15px] font-medium transition ${
                      reason === option
                        ? 'border-brand-500 bg-brand-50/60 text-brand-600'
                        : 'border-line hover:bg-surface-sunken'
                    }`}
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                        reason === option ? 'border-brand-500' : 'border-line'
                      }`}
                    >
                      {reason === option && (
                        <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                      )}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>

            <label htmlFor="report-detail" className="mt-6 block font-bold">
              Anything else? <span className="font-normal text-ink-muted">(optional)</span>
            </label>
            <textarea
              id="report-detail"
              rows={3}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="What happened?"
              className="field mt-2 resize-y"
            />

            {error && (
              <p role="alert" className="mt-4 text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-primary mt-6 w-full py-3.5"
            >
              <Flag size={17} /> {busy ? 'Sending...' : 'Submit report'}
            </button>
          </form>

          {blockable && (
            <>
              <span className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-ink-faint">
                <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
              </span>
              <button
                onClick={() => void block()}
                disabled={busy}
                className="btn w-full border border-danger/30 bg-danger-soft py-3.5 text-danger hover:bg-danger-softer"
              >
                <Ban size={17} /> Block {subjectName}
              </button>
              <p className="mt-2 text-center text-sm text-ink-muted">
                Hides their listings and stops them messaging you.
              </p>
            </>
          )}
        </>
      )}
    </Sheet>
  )
}
