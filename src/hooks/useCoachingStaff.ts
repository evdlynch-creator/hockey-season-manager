import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { useTeam } from './useTeam'
import type { SeasonMember, Invitation, SeasonRole } from '../types'
import { DEMO_MEMBERS, DEMO_INVITATIONS, isDemoMode } from './useDemoData'

export function useCoachingStaff() {
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  const staffQuery = useQuery({
    queryKey: ['coaching-staff', seasonId, isDemoMode()],
    queryFn: async () => {
      if (isDemoMode()) {
        return { members: DEMO_MEMBERS, invitations: DEMO_INVITATIONS }
      }
      if (!seasonId) return []
      
      // Fetch members and resolve emails
      const members = (await blink.db.seasonMembers.list({
        where: { seasonId },
      })) as SeasonMember[]

      // Fetch invitation list
      const invitations = (await blink.db.invitations.list({
        where: { seasonId, status: 'pending' }
      })) as Invitation[]

      return { members, invitations }
    },
    enabled: !!seasonId || isDemoMode(),
  })

  return staffQuery
}

export function useInviteCoach() {
  const queryClient = useQueryClient()
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: SeasonRole }) => {
      if (!seasonId) throw new Error('No active season')
      const { user } = await blink.auth.me()
      if (!user) throw new Error('Not authenticated')
      
      const token = crypto.randomUUID()
      const inviteId = `invite_${crypto.randomUUID().slice(0, 8)}`
      
      await blink.db.invitations.create({
        id: inviteId,
        seasonId,
        userId: user.id,
        email,
        role,
        token,
        status: 'pending'
      })

      return { token }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-staff', seasonId] })
    }
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  return useMutation({
    mutationFn: async (memberId: string) => {
      await blink.db.seasonMembers.delete(memberId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-staff', seasonId] })
    }
  })
}

export function useCancelInvitation() {
  const queryClient = useQueryClient()
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  return useMutation({
    mutationFn: async (inviteId: string) => {
      await blink.db.invitations.delete(inviteId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-staff', seasonId] })
    }
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()
  const { data: teamData } = useTeam()
  const seasonId = teamData?.season?.id

  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: SeasonRole }) => {
      await blink.db.seasonMembers.update(memberId, { role })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-staff', seasonId] })
    }
  })
}