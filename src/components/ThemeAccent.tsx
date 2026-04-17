import { useEffect } from 'react'
import { useTeam } from '../hooks/useTeam'
import { useTeamPreferences, useViewMode } from '../hooks/usePreferences'

interface Hsl {
  h: number
  s: number
  l: number
}

function hexToHsl(hex: string): Hsl | null {
  const cleaned = hex.replace('#', '').trim()
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(cleaned)) return null
  const full =
    cleaned.length === 3
      ? cleaned.split('').map((c) => c + c).join('')
      : cleaned
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h *= 60
  }
  return { h, s: s * 100, l: l * 100 }
}

const VARS = ['--primary', '--sidebar-primary', '--ring', '--sidebar-ring']
const FG_VARS = ['--primary-foreground', '--sidebar-primary-foreground']

const DEFAULT_HSL: Hsl = { h: 38, s: 92, l: 50 }
const DEFAULT_FG = '0 0% 7%'

function applyAccent(hsl: Hsl) {
  const root = document.documentElement
  const value = `${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`
  VARS.forEach((v) => root.style.setProperty(v, value))
  // Pick a foreground that contrasts with the chosen primary.
  const fg = hsl.l > 60 ? '240 10% 8%' : '0 0% 100%'
  FG_VARS.forEach((v) => root.style.setProperty(v, fg))
}

function clearAccent() {
  const root = document.documentElement
  ;[...VARS, ...FG_VARS].forEach((v) => root.style.removeProperty(v))
}

// Tournament view always paints in gold, regardless of team color preference.
const TOURNAMENT_HSL: Hsl = { h: 43, s: 96, l: 56 }

export function ThemeAccent() {
  const { data: teamData } = useTeam()
  const teamId = teamData?.team.id
  const [prefs] = useTeamPreferences(teamId)
  const { mode } = useViewMode(teamId)

  useEffect(() => {
    if (mode === 'tournament') {
      applyAccent(TOURNAMENT_HSL)
      return () => clearAccent()
    }
    if (!teamId || !prefs.primaryColor) {
      const value = `${DEFAULT_HSL.h} ${DEFAULT_HSL.s}% ${DEFAULT_HSL.l}%`
      VARS.forEach((v) => document.documentElement.style.setProperty(v, value))
      FG_VARS.forEach((v) => document.documentElement.style.setProperty(v, DEFAULT_FG))
      return
    }
    const hsl = hexToHsl(prefs.primaryColor)
    if (!hsl) return
    applyAccent(hsl)
    return () => clearAccent()
  }, [teamId, prefs.primaryColor, mode])

  return null
}
