import { createClient } from '@blinkdotnew/sdk'

const isInIframe = typeof window !== 'undefined' && window.self !== window.top

const proxyConfig = isInIframe
  ? {
      authUrl: window.location.origin,
      coreUrl: window.location.origin,
    }
  : {}

if (typeof window !== 'undefined') {
  console.log('🔧 Blink client config:', { isInIframe, ...proxyConfig, origin: window.location.origin })
}

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID,
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY,
  authRequired: !isInIframe,
  auth: {
    mode: isInIframe ? 'headless' : 'managed',
    ...proxyConfig,
  },
})
