import { useEffect, useState } from 'react'
import { ShieldCheck, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import {
  clearDriftEvent,
  normalizeEmail,
  readLatestDriftEvent,
  type DriftEvent,
} from '../lib/identity'

const FRESH_WINDOW_MS = 5 * 60 * 1000

export function SessionReissuedBanner() {
  const { user } = useAuth()
  const [drift, setDrift] = useState<DriftEvent | null>(null)

  useEffect(() => {
    const evt = readLatestDriftEvent()
    if (!evt) return
    const fresh = Date.now() - evt.detectedAt < FRESH_WINDOW_MS
    const myEmail = normalizeEmail(user?.email ?? '')
    if (!fresh) {
      clearDriftEvent()
      return
    }
    if (myEmail && normalizeEmail(evt.email) !== myEmail) return
    setDrift(evt)
  }, [user?.email])

  if (!drift) return null

  return (
    <div
      role="status"
      className="mb-6 rounded-md border border-blue-500/30 bg-blue-500/5 p-3 text-sm flex items-center gap-3 animate-fade-in"
    >
      <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" aria-hidden />
      <p className="flex-1 text-muted-foreground">
        <span className="font-medium text-foreground">Session refreshed.</span>{' '}
        The workspace just gave your account a new internal session id. Your team
        was reattached automatically.
      </p>
      <button
        type="button"
        onClick={() => {
          clearDriftEvent()
          setDrift(null)
        }}
        className="text-muted-foreground hover:text-foreground rounded p-1"
        aria-label="Dismiss notice"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
