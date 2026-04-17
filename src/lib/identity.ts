/**
 * Identity-stability helpers for Task #20.
 *
 * Background: when running inside the Replit/Blink workspace iframe, the
 * Blink SDK requests auth tokens from the parent window via postMessage.
 * Each parent reload can hand the iframe a fresh internal `user.id` for
 * the same email, which silently churns identity and breaks team lookups.
 * We can't change the SDK or the platform, so we:
 *   1. Decode the JWT access tokens client-side to compare email/userId
 *      between the parent payload and what's already in localStorage.
 *   2. Track a per-email "history" of seen user.ids so drift is detectable
 *      across pageloads.
 *   3. Surface a single "drift just happened" flag the UI can read to show
 *      a recovery banner or pre-warm the auto-claim.
 *
 * All helpers are SSR-safe (return sensible defaults when window is absent)
 * and never throw on malformed storage — recovery must never be blocked by
 * a parsing error.
 */

const PROJECT_ID: string | undefined = import.meta.env.VITE_BLINK_PROJECT_ID

const HISTORY_KEY_PREFIX = 'identity-history'
const DRIFT_FLAG_KEY_PREFIX = 'identity-drift'
const MAX_IDS_PER_EMAIL = 10

export interface DecodedToken {
  userId: string | null
  email: string | null
  expiresAt: number | null // unix seconds
}

export interface IdentitySeen {
  userId: string
  email: string
  seenAt: number // ms
  source: 'auth-state'
}

export interface DriftEvent {
  email: string
  previousUserId: string
  currentUserId: string
  detectedAt: number // ms
}

function historyKey(): string {
  return `${HISTORY_KEY_PREFIX}:${PROJECT_ID ?? 'unknown'}`
}

function driftFlagKey(): string {
  return `${DRIFT_FLAG_KEY_PREFIX}:${PROJECT_ID ?? 'unknown'}`
}

function tokensStorageKey(): string {
  return `blink_tokens_${PROJECT_ID ?? 'unknown'}`
}

export function normalizeEmail(raw: string | null | undefined): string {
  return (raw ?? '').trim().toLowerCase()
}

/**
 * Decode a JWT payload without verifying the signature. We only use the
 * decoded values to make local comparisons (same email? same sub?) — never
 * for authorization decisions. Returns nulls when decoding fails.
 */
export function decodeJwt(token: string | null | undefined): DecodedToken {
  const empty: DecodedToken = { userId: null, email: null, expiresAt: null }
  if (!token || typeof token !== 'string') return empty
  const parts = token.split('.')
  if (parts.length < 2) return empty
  try {
    // base64url → base64
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    const json = typeof atob === 'function' ? atob(padded) : ''
    if (!json) return empty
    const claims = JSON.parse(json) as Record<string, unknown>
    const userId =
      (typeof claims.sub === 'string' && claims.sub) ||
      (typeof claims.user_id === 'string' && claims.user_id) ||
      (typeof claims.userId === 'string' && claims.userId) ||
      null
    const email =
      typeof claims.email === 'string' ? normalizeEmail(claims.email) : null
    const expiresAt = typeof claims.exp === 'number' ? claims.exp : null
    return { userId, email, expiresAt }
  } catch {
    return empty
  }
}

interface StoredTokensShape {
  access_token?: string
  refresh_token?: string
  issued_at?: number
  expires_in?: number
}

export function readStoredTokens(): StoredTokensShape | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(tokensStorageKey())
    if (!raw) return null
    return JSON.parse(raw) as StoredTokensShape
  } catch {
    return null
  }
}

/** True when the stored access token's `exp` is at least 60s in the future. */
export function isAccessTokenStillValid(stored: StoredTokensShape | null): boolean {
  if (!stored?.access_token) return false
  const decoded = decodeJwt(stored.access_token)
  if (decoded.expiresAt) {
    return decoded.expiresAt - 60 > Math.floor(Date.now() / 1000)
  }
  // Fall back to issued_at + expires_in if `exp` claim is missing.
  if (typeof stored.issued_at === 'number' && typeof stored.expires_in === 'number') {
    return stored.issued_at + stored.expires_in - 60 > Math.floor(Date.now() / 1000)
  }
  return false
}

interface IdentityHistory {
  byEmail: Record<string, IdentitySeen[]>
}

function readHistory(): IdentityHistory {
  if (typeof window === 'undefined') return { byEmail: {} }
  try {
    const raw = window.localStorage.getItem(historyKey())
    if (!raw) return { byEmail: {} }
    const parsed = JSON.parse(raw) as IdentityHistory
    return parsed && typeof parsed === 'object' && parsed.byEmail
      ? parsed
      : { byEmail: {} }
  } catch {
    return { byEmail: {} }
  }
}

function writeHistory(h: IdentityHistory): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(historyKey(), JSON.stringify(h))
  } catch {
    /* quota or disabled storage — silent */
  }
}

/**
 * Record the current sign-in identity in the history ledger.
 * Returns the previous userId for this email if it differs (drift detected).
 */
export function recordIdentitySeen(
  email: string | null | undefined,
  userId: string | null | undefined,
): { drifted: boolean; previousUserId: string | null } {
  const e = normalizeEmail(email)
  if (!e || !userId) return { drifted: false, previousUserId: null }
  const history = readHistory()
  const list = history.byEmail[e] ?? []
  const last = list[list.length - 1]
  const drifted = !!last && last.userId !== userId
  const previousUserId = drifted ? last.userId : null
  if (!last || last.userId !== userId) {
    list.push({ userId, email: e, seenAt: Date.now(), source: 'auth-state' })
    history.byEmail[e] = list.slice(-MAX_IDS_PER_EMAIL)
    writeHistory(history)
  }
  return { drifted, previousUserId }
}

export function getIdentityHistoryForEmail(email: string | null | undefined): IdentitySeen[] {
  const e = normalizeEmail(email)
  if (!e) return []
  return readHistory().byEmail[e] ?? []
}

export function recordDriftEvent(event: DriftEvent): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(driftFlagKey(), JSON.stringify(event))
  } catch {
    /* silent */
  }
}

export function readLatestDriftEvent(): DriftEvent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(driftFlagKey())
    if (!raw) return null
    return JSON.parse(raw) as DriftEvent
  } catch {
    return null
  }
}

export function clearDriftEvent(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(driftFlagKey())
  } catch {
    /* silent */
  }
}
