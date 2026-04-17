# Blue Line IQ

A React + TypeScript + Vite hockey coaching, season management, and analytics dashboard application.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS 3.3.5 + Framer Motion
- **Routing**: TanStack Router
- **State/Data**: TanStack Query
- **UI Components**: Blink UI (`@blinkdotnew/ui`)
- **Charts**: Recharts
- **3D**: React Three Fiber + Drei
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

## Project Structure

```
src/
  App.tsx          - Root app component
  main.tsx         - Entry point with providers
  blink/           - Blink SDK client configuration
  components/      - Reusable UI components
  hooks/           - Custom React hooks (useAuth, useGames, usePractices, useTeam, useSeasons, usePreferences, useAnalytics)
  layouts/         - Layout components
  pages/           - App views (GamesPage, PracticesPage, TrendsPage, CalendarPage, etc.)
  lib/             - Utility functions
  types/           - TypeScript type definitions
```

## Development

```bash
npm run dev     # Start dev server on port 5000
npm run build   # Build for production (outputs to dist/)
```

## Configuration

- **Dev server**: Port 5000, host `0.0.0.0`, all hosts allowed
- **Deployment**: Static site (build: `npm run build`, publicDir: `dist`)
- **Env vars**: `VITE_BLINK_PROJECT_ID` required for Blink SDK authentication

## Notes

- The Blink SDK (`@blinkdotnew/sdk`) is used for authentication and backend integration
- The app uses a "linear" dark theme via BlinkUIProvider
- **Multi-coach access**: `teamMembers` table (Blink auto-creates) tracks `(teamId, userId, email, role, status, invitedBy, invitedByName, createdAt, updatedAt)` where `role: 'owner' | 'coach'` and `status: 'active' | 'pending'`. Emails are stored lowercased+trimmed. Onboarding creates an `owner` membership for the founder and stamps `teams.plan = 'beta_free'` + `teams.seatLimit = null`. Pending email invites are auto-claimed when the invitee signs in (matched by email) — the auto-claim and a one-time owner backfill for legacy teams happen inside `useTeam`'s queryFn (idempotent). Coaches share all team data (practices, games, ratings); `useTeam` resolves the active team via membership lookup, `useMyTeams` powers the sidebar team switcher (only renders for users with >1 team), and `useActiveTeamId(userId)` persists the choice in localStorage at `active-team:{userId}`. The Coaching Staff page (`/team`) lets the owner invite/resend/revoke/remove coaches; Settings → Danger Zone exposes "Leave team" for non-owner coaches. `useTeamPlan(teamId)` returns `{plan, seatLimit, seatsUsed}` as the single seat-counting helper for the future paywall. Note: like all other tables, membership writes are client-side; trust model matches the rest of the app.
- **Identity stability (Task #20)**: The Blink SDK requests parent-window auth tokens via postMessage when running inside the workspace iframe (see `node_modules/@blinkdotnew/sdk/dist/index.mjs:5211-5302`). Each parent reload could hand the iframe a fresh internal `user.id` for the same email and silently churn identity, orphaning team data. `src/blink/client.ts` now installs an `installIframeIdentityGuard()` listener BEFORE `createClient(...)` so it fires before the SDK's own listener; when an incoming `BLINK_AUTH_TOKENS` message has the same email but a different `user.id` than valid local tokens, it calls `event.stopImmediatePropagation()` to keep the existing session. JWT payloads are decoded client-side via `src/lib/identity.ts` (`decodeJwt`, `isAccessTokenStillValid`) — used only for local comparisons, never authorization. `useAuth` records every (email, userId) pair to `identity-history:{projectId}` (capped at 10 per email), logs a structured warning on drift, persists a `DriftEvent` to `identity-drift:{projectId}`, and invalidates the team-resolution queries so the single-orphan auto-claim in `useTeam` re-runs immediately under the new id (no flash of "no team on this account"). `NoTeamScreen` reads the drift event (5-min freshness window) and renders a blue explainer banner with a Dismiss action. Production (managed mode, no iframe) is not affected by the parent-window vector — drift there would require a platform-side fix and would still be caught by the Task #16 recovery flow.
- **Game-type tagging + view-mode filter**: Schema is fixed, so each game's category (`league` | `tournament` | `exhibition`, default `league`) lives client-side in localStorage at `game-types:{teamId}` via `useGameTypes`. A global view mode (`season` | `league` | `tournament` | `exhibition`) is persisted at `view-mode:{teamId}` via `useViewMode`. The `<ViewModeSwitcher />` in the sidebar is the single source of truth. `useFilteredAnalytics` wraps `useAnalytics` and applies `applyViewModeFilter` (filters games + reviews and rebuilds `byConcept` via the extracted `buildByConcept` helper). Dashboard, Concepts, Trends, Opponents, and Games all read filtered data; Game detail page exposes a Type select. When mode is `tournament`, `ThemeAccent` overrides the team accent with gold (hsl 43 96% 56%).
