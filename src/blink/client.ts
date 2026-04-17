import { createClient } from '@blinkdotnew/sdk'

const isInIframe = typeof window !== 'undefined' && window.self !== window.top

const proxyConfig = isInIframe
  ? {
      authUrl: window.location.origin,
      coreUrl: window.location.origin,
    }
  : {}

if (typeof window !== 'undefined' && !(window as any).__fetchPatched) {
  (window as any).__fetchPatched = true
  const originalFetch = window.fetch.bind(window)
  window.fetch = async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input?.url
    if (url && (url.includes('blink') || url.includes('/api/'))) {
      console.log('🌐 fetch:', init?.method || 'GET', url)
    }
    try {
      const r = await originalFetch(input, init)
      if (url && (url.includes('blink') || url.includes('/api/'))) {
        console.log('🌐 fetch result:', r.status, url)
      }
      return r
    } catch (e: any) {
      console.error('🌐 fetch ERROR:', url, e?.name, e?.message)
      throw e
    }
  }
  console.log('🔧 Blink client config:', { isInIframe, ...proxyConfig })
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
