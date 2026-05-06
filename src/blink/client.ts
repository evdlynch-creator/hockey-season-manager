import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'blue-line-iq-qpy3h1ap',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_cJpfpBNGg6PlOjdD6tzwKIJbjL0eh6CN',
  auth: {
    mode: 'managed',
    authUrl: typeof window !== 'undefined' ? window.location.origin : undefined,
  },
})
