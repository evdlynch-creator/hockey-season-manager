import { createClient } from '@blinkdotnew/sdk'
import { decodeJwt, isAccessTokenStillValid, normalizeEmail, readStoredTokens } from '../lib/identity'

const isInIframe = typeof window !== 'undefined' && window.self !== window.top
const proxyOrigin = typeof window !== 'undefined' ? window.location.origin : ''

const proxyConfig = isInIframe
  ? { authUrl: proxyOrigin, coreUrl: proxyOrigin }
  : {}

/**
 * Boot-time source classification (Task #20 diagnostics).
 *
 * Logs which signal is about to bootstrap the Blink session so every
 * auth transition can be attributed at glance:
 *   - `url-fragment`: tokens are present in the page URL (managed-mode
 *     OAuth redirect)
 *   - `stored-tokens`: tokens already exist in localStorage (revisit)
 *   - `parent-window`: iframe will request tokens from the workspace
 *     parent via postMessage (handled by the SDK + our guard below)
 *   - `none`: no tokens anywhere — the SDK will redirect to the auth
 *     page (managed) or stay anonymous (headless+no parent)
 */
function logBootSource() {
  if (typeof window === 'undefined') return
  const hash = window.location.hash || ''
  const hasUrlTokens = /access_token=/.test(hash) || /refresh_token=/.test(hash)
  const stored = readStoredTokens()
  const localValid = isAccessTokenStillValid(stored)
  const local = decodeJwt(stored?.access_token)
  let source: 'url-fragment' | 'stored-tokens' | 'parent-window' | 'none'
  if (hasUrlTokens) source = 'url-fragment'
  else if (localValid) source = 'stored-tokens'
  else if (isInIframe) source = 'parent-window'
  else source = 'none'
  console.log('[auth-source] boot', {
    source,
    isInIframe,
    storedUserId: local.userId,
    storedEmail: local.email,
    storedValid: localValid,
  })
}

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
        console.warn('[auth-source] parent-window token SUPPRESSED', {
          reason: 'same-email-different-userid',
          email: localEmail,
          localUserId: local.userId,
          incomingUserId: incoming.userId,
        })
        // Block the SDK's listener from seeing this message so it doesn't
        // overwrite our tokens.
        event.stopImmediatePropagation()
      } else {
        console.log('[auth-source] parent-window token ACCEPTED', {
          email: incomingEmail,
          incomingUserId: incoming.userId,
          localUserId: local.userId,
          sameEmail,
          differentUser,
        })
      }
    },
    // Use capture phase so we run before the SDK's bubble-phase listener.
    true,
  )
}

logBootSource()
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
