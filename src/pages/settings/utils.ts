import { parseISO, isValid } from 'date-fns'

export const AGE_GROUPS = ['U8', 'U10', 'U12', 'U13', 'U14', 'U15', 'U16', 'U18', 'Junior', 'Senior', 'Adult']
export const TEAM_LEVELS = ['House', 'Tier 3', 'Tier 2', 'Tier 1', 'AA', 'AAA', 'Prep', 'Junior A', 'Other']

export function isValidDateStr(s: string) {
  if (!s) return false
  const d = parseISO(s)
  return isValid(d)
}

export function parsePriority(json: string | undefined | null): string[] {
  if (!json) return []
  try {
    const v = JSON.parse(json)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export const PRESET_COLORS: { name: string; value: string }[] = [
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Crimson', value: '#b91c1c' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Forest', value: '#15803d' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Navy', value: '#1d4ed8' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Slate', value: '#64748b' },
  { name: 'Black', value: '#111827' },
]
