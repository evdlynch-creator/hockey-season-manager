import { useBlinkAuth } from '@blinkdotnew/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'

/**
 * Standard hook for accessing auth state throughout the application.
 * Wraps @blinkdotnew/react useBlinkAuth to ensure consistent synchronized state.
 */
export function useAuth() {
  const { user, isLoading, isAuthenticated } = useBlinkAuth()
  
  // Diagnostic logging for auth state transitions
  if (typeof window !== 'undefined' && !import.meta.env.PROD) {
    console.debug('[Auth] State Update:', { 
      isLoading, 
      isAuthenticated, 
      userId: user?.id,
      url: window.location.href 
    })
  }

  return { user, isLoading, isAuthenticated }
}

/**
 * Hook for updating user profile data.
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (patch: { displayName?: string; avatarUrl?: string | null }) => {
      await blink.auth.updateMe(patch)
    },
    onSuccess: () => {
      // Invalidate relevant queries to pick up profile changes
      queryClient.invalidateQueries({ queryKey: ['team'] })
    },
  })
}
