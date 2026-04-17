import { createClient } from '@blinkdotnew/sdk'

const isInIframe = typeof window !== 'undefined' && window.self !== window.top
const proxyOrigin = typeof window !== 'undefined' ? window.location.origin : ''

const proxyConfig = isInIframe
  ? { authUrl: proxyOrigin, coreUrl: proxyOrigin }
  : {}

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID,
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY,
  authRequired: !isInIframe,
  auth: {
    mode: isInIframe ? 'headless' : 'managed',
    ...proxyConfig,
  },
})

if (isInIframe) {
  const httpClient = (blink as any)._httpClient
  if (httpClient) {
    httpClient.coreUrl = proxyOrigin
    httpClient.authUrl = proxyOrigin
  }
}
