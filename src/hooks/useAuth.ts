import { useState, useEffect, useRef } from 'react'
import { blink } from '../blink/client'
import { BlinkUser } from '@blinkdotnew/sdk'

export function useAuth() {
  const [user, setUser] = useState<BlinkUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const lastUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      const nextId = state.user?.id ?? null
      if (nextId !== lastUserIdRef.current) {
        lastUserIdRef.current = nextId
        setUser(state.user ?? null)
      }
      if (!state.isLoading) setIsLoading(false)
    })
    return unsubscribe
  }, [])

  return { user, isLoading, isAuthenticated: !!user }
}
