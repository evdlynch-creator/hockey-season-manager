import { createClient } from '@blinkdotnew/sdk'

const isInIframe = typeof window !== 'undefined' && window.self !== window.top

function getProxiedUrls() {
  if (typeof window === 'undefined' || !isInIframe) return {}
  const origin = window.location.origin
  return {
    authUrl: `${origin}/blink-proxy/auth`,
    coreUrl: `${origin}/blink-proxy/core`,
  }
}

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID,
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY,
  authRequired: !isInIframe,
  auth: {
    mode: isInIframe ? 'headless' : 'managed',
    ...getProxiedUrls(),
  },
})
