# Inside Edge Manager

A React + TypeScript + Vite sports management/analytics dashboard application.

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
  hooks/           - Custom React hooks (useAuth, useGames, usePractices, useTeam, useAnalytics)
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
