import { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { BlinkUser } from '@blinkdotnew/sdk'
import {
  recordIdentitySeen,
  recordDriftEvent,
  normalizeEmail,
} from '../lib/identity'

/**
 * Auth state hook (Task #20-aware).
 *
 * In addition to surfacing the current Blink user, this hook:
 *  - Records every (email, user.id) pair we see in `identity-history:<projectId>`.
 *  - When the user.id flips for the same email, it logs a structured warning,
 *    persists a `DriftEvent` to localStorage so the recovery UI can explain
 *    what happened, and invalidates the team-resolution queries so the
 *    single-orphan auto-claim path in `useTeam` re-runs immediately under
 *    the new user.id (no flash of "no team on this account").
 */
export function useAuth() {
  const [user, setUser] = useState<BlinkUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const lastUserIdRef = useRef<string | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      const nextId = state.user?.id ?? null
      const nextEmail = normalizeEmail(state.user?.email ?? '')

      if (nextId !== lastUserIdRef.current) {
        const previousId = lastUserIdRef.current
        lastUserIdRef.current = nextId
        setUser(state.user ?? null)

        // Record + detect identity drift for the same email.
        if (nextId && nextEmail) {
          const { drifted, previousUserId } = recordIdentitySeen(nextEmail, nextId)
          if (drifted && previousUserId) {
            console.warn(
              '[identity-drift] sign-in user.id changed for same email',
              { email: nextEmail, previousUserId, currentUserId: nextId },
            )
            recordDriftEvent({
              email: nextEmail,
              previousUserId,
              currentUserId: nextId,
              detectedAt: Date.now(),
            })
            // Pre-warm recovery: kick the team-resolution queries so the
            // single-orphan auto-claim re-runs against the new user.id
            // before the dashboard shows a "no team" state.
            queryClient.invalidateQueries({ queryKey: ['team'] })
            queryClient.invalidateQueries({ queryKey: ['myTeams'] })
            queryClient.invalidateQueries({ queryKey: ['teamMembers'] })
            queryClient.invalidateQueries({ queryKey: ['orphanTeams'] })
          } else if (previousId && previousId !== nextId && !drifted) {
            // Genuine sign-in/account-switch — also invalidate so cached
            // team data doesn't bleed across identities.
            queryClient.invalidateQueries({ queryKey: ['team'] })
            queryClient.invalidateQueries({ queryKey: ['myTeams'] })
            queryClient.invalidateQueries({ queryKey: ['teamMembers'] })
            queryClient.invalidateQueries({ queryKey: ['orphanTeams'] })
          }
        }
      }
      if (!state.isLoading) setIsLoading(false)
    })
    return unsubscribe
  }, [queryClient])

  return { user, isLoading, isAuthenticated: !!user }
}
