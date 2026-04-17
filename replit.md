# Blue Line IQ

A React + TypeScript + Vite hockey coaching / season management & analytics dashboard application (formerly "Inside Edge Manager").

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
- **Multi-coach access**: `team_members` table tracks (teamId, userId, email, role, status). Onboarding creates an `owner` membership for the founder. Pending email invites are auto-claimed when the invitee signs in (matched by email). Coaches share all team data (practices, games, ratings) — `useTeam` resolves the team via membership lookup; other hooks scope by `teamId`/`seasonId`. UI in `/team`. Note: like all other tables, membership writes are client-side; trust model matches the rest of the app.
- **Game-type tagging + view-mode filter**: Schema is fixed, so each game's category (`league` | `tournament` | `exhibition`, default `league`) lives client-side in localStorage at `game-types:{teamId}` via `useGameTypes`. A global view mode (`season` | `league` | `tournament` | `exhibition`) is persisted at `view-mode:{teamId}` via `useViewMode`. The `<ViewModeSwitcher />` in the sidebar is the single source of truth. `useFilteredAnalytics` wraps `useAnalytics` and applies `applyViewModeFilter` (filters games + reviews and rebuilds `byConcept` via the extracted `buildByConcept` helper). Dashboard, Concepts, Trends, Opponents, and Games all read filtered data; Game detail page exposes a Type select. When mode is `tournament`, `ThemeAccent` overrides the team accent with gold (hsl 43 96% 56%).
