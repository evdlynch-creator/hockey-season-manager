import { useState, useEffect } from 'react'

const UNREAD_KEY = 'unread_coach_messages'
const LAST_SEEN_KEY = 'last_seen_coach_message_at'

export function useUnreadCoachMessages() {
  const [hasUnread, setHasUnread] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(UNREAD_KEY) === 'true'
  })

  const markSeen = () => {
    localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString())
    localStorage.setItem(UNREAD_KEY, 'false')
    setHasUnread(false)
    window.dispatchEvent(new StorageEvent('storage', {
      key: UNREAD_KEY,
      newValue: 'false'
    }))
  }

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === UNREAD_KEY) {
        setHasUnread(e.newValue === 'true')
      }
    }

    window.addEventListener('storage', handleStorage)
    
    // Also check local changes in same tab
    const interval = setInterval(() => {
      const current = localStorage.getItem(UNREAD_KEY) === 'true'
      if (current !== hasUnread) {
        setHasUnread(current)
      }
    }, 1000)

    return () => {
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [hasUnread])

  const setUnread = (val: boolean) => {
    localStorage.setItem(UNREAD_KEY, String(val))
    setHasUnread(val)
    window.dispatchEvent(new StorageEvent('storage', {
      key: UNREAD_KEY,
      newValue: String(val)
    }))
  }

  return { hasUnread, setUnread, markSeen }
}