import { useQuery } from '@tanstack/react-query'
import { useTeam } from './useTeam'
import { blink } from '../blink/client'
import { useAuth } from './useAuth'
import type { SeasonRole } from '../types'
import { isDemoMode } from './useDemoData'

export function usePermissions() {
  const { user } = useAuth()
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  return useQuery({
    queryKey: ['permissions', seasonId, user?.id, isDemoMode()],
    queryFn: async () => {
      if (isDemoMode()) return 'owner' as SeasonRole
      if (!user || !seasonId) return null

      // Check if user is a member of the season
      const members = await blink.db.seasonMembers.list({
        where: { seasonId, userId: user.id }
      })

      if (members.length > 0) {
        return members[0].role as SeasonRole
      }

      // Fallback: If no membership record exists, check if the user is the team owner
      // This ensures existing owners maintain access to seasons they created
      const team = teamData?.team
      if (team?.userId === user.id) {
        return 'owner' as SeasonRole
      }

      return null
    },
    enabled: !!user && !!seasonId
  })
}

export function useIsOwner() {
  const { data: role } = usePermissions()
  return role === 'owner'
}

export function useCanEdit() {
  const { data: role } = usePermissions()
  return role === 'owner' || role === 'assistant'
}