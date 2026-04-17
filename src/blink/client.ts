import { createClient } from '@blinkdotnew/sdk'
import { decodeJwt, isAccessTokenStillValid, normalizeEmail, readStoredTokens } from '../lib/identity'

const isInIframe = typeof window !== 'undefined' && window.self !== window.top
const proxyOrigin = typeof window !== 'undefined' ? window.location.origin : ''

const proxyConfig = isInIframe
  ? { authUrl: proxyOrigin, coreUrl: proxyOrigin }
  : {}

/**
 * Iframe-only identity-stability guard (Task #20).
 *
 * The Blink SDK installs its own `message` listener in `setupParentWindowListener`
 * (see node_modules/@blinkdotnew/sdk/dist/index.mjs:5211-5242) when its
 * constructor runs. That listener accepts `BLINK_AUTH_TOKENS` from
 * `https://blink.new` / `http://localhost:3000` / `http://localhost:3001`
 * and unconditionally overwrites our stored tokens. When the parent
 * workspace has been reissued a fresh internal user.id for the same email,
 * this silently churns identity and orphans team data.
 *
 * We register our own listener BEFORE `createClient(...)` runs so we fire
 * first, decode the incoming JWT, and `stopImmediatePropagation()` whenever:
 *   - we already have a valid local access token AND
 *   - the parent token's email matches ours AND
 *   - the parent token's user.id differs from ours.
 *
 * In every other case (no local tokens, expired local tokens, different
 * email = real account switch, or undecodable tokens) we fall through to
 * the SDK's listener so first-time sign-in and genuine sign-out keep
 * working.
 *
 * NOTE on production: when the app runs OUTSIDE an iframe, this guard
 * never installs and the SDK uses its standard `managed` flow (URL
 * fragments + localStorage). Drift in production has not been observed.
 * If users ever report it, that needs a platform-side fix because there
 * is no parent-window vector to suppress.
 */
function installIframeIdentityGuard() {
  if (typeof window === 'undefined' || !isInIframe) return
  const allowedOrigins = new Set([
    'https://blink.new',
    'http://localhost:3000',
    'http://localhost:3001',
  ])
  window.addEventListener(
    'message',
    (event: MessageEvent) => {
      if (!allowedOrigins.has(event.origin)) return
      const data = event.data as { type?: string; tokens?: { access_token?: string } } | null
      if (!data || data.type !== 'BLINK_AUTH_TOKENS') return
      const incomingToken = data.tokens?.access_token
      if (!incomingToken) return

      const incoming = decodeJwt(incomingToken)
      const stored = readStoredTokens()
      const local = decodeJwt(stored?.access_token)
      const localValid = isAccessTokenStillValid(stored)

      // Only guard when we have a valid local session AND incoming has a
      // decodable email/userId we can compare to.
      if (!localValid || !local.userId || !incoming.userId) return
      const localEmail = normalizeEmail(local.email)
      const incomingEmail = normalizeEmail(incoming.email)
      if (!localEmail || !incomingEmail) return

      const sameEmail = localEmail === incomingEmail
      const differentUser = local.userId !== incoming.userId
      if (sameEmail && differentUser) {
        console.warn(
          '[identity-guard] Suppressing parent-window token: same email, different user.id',
          { email: localEmail, localUserId: local.userId, incomingUserId: incoming.userId },
        )
        // Block the SDK's listener from seeing this message so it doesn't
        // overwrite our tokens.
        event.stopImmediatePropagation()
      }
    },
    // Use capture phase so we run before the SDK's bubble-phase listener.
    true,
  )
}

installIframeIdentityGuard()

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
