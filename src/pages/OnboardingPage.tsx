import { useAuth } from '../hooks/useAuth'
import { useTeam } from '../hooks/useTeam'
import { blink } from '../blink/client'
import { 
  Button, 
  LoadingOverlay, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  Input,
  Field,
  FieldLabel,
  FieldError,
  Badge,
  toast,
} from '@blinkdotnew/ui'
import { Rocket, Calendar as CalendarIcon, Users } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Invitation, Season, Team, CONCEPTS } from '../types'
import { cn } from '@/lib/utils'

const onboardingSchema = z.object({
  teamName: z.string().min(1, 'Team name is required'),
  seasonName: z.string().min(1, 'Season name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  concepts: z.array(z.string()).min(3, 'Select at least 3 concepts').max(5, 'Select at most 5 concepts'),
})

type OnboardingData = z.infer<typeof onboardingSchema>

export default function OnboardingPage() {
  const { user, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const search = useSearch({ from: '/onboarding' }) as { mode?: string, invite?: string }
  const { data: existingTeam, isFetching: teamFetching, isSuccess: teamSuccess } = useTeam()

  const isAddingNewTeam = search.mode === 'new_team'
  const inviteToken = search.invite

  const [inviteData, setInviteData] = useState<{ id: string, seasonId: string, email: string, role: string, teamName: string, seasonName: string } | null>(null)
  const [verifyingInvite, setVerifyingInvite] = useState(!!inviteToken)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  // Redirect to login if invite token is present but user is not logged in
  useEffect(() => {
    if (inviteToken && !authLoading && !user) {
      blink.auth.login(window.location.href)
    }
  }, [inviteToken, authLoading, user])

  const { register, handleSubmit, setValue, getValues, watch, formState: { errors, isSubmitting } } = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      concepts: [],
      teamName: '',
      seasonName: '',
      startDate: '',
      endDate: '',
    }
  })

  const selectedConcepts = watch('concepts')

  useEffect(() => {
    const hasTeam = !isAddingNewTeam && !inviteToken && !!existingTeam?.team
    const hasSeason = !!existingTeam?.season

    if (!isAddingNewTeam && !inviteToken && !authLoading && user && teamSuccess && !teamFetching && hasTeam && hasSeason) {
      navigate({ to: '/', replace: true })
    }
  }, [existingTeam, isAddingNewTeam, inviteToken, authLoading, user, teamSuccess, teamFetching, navigate])

  useEffect(() => {
    const hasTeam = !isAddingNewTeam && !inviteToken && !!existingTeam?.team
    if (hasTeam && existingTeam?.team?.name) {
      setValue('teamName', existingTeam.team.name || '')
    }
  }, [existingTeam, isAddingNewTeam, inviteToken, setValue])

  const mutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      if (!user) throw new Error('Not authenticated')

      let teamId = isAddingNewTeam ? null : existingTeam?.team?.id
      
      if (!teamId) {
        const newTeam = await blink.db.teams.create({ 
          name: data.teamName,
          userId: user.id
        })
        teamId = newTeam.id
      }

      const newSeason = await blink.db.seasons.create({
        teamId: teamId,
        userId: user.id,
        name: data.seasonName,
        startDate: data.startDate,
        endDate: data.endDate,
        priorityConcepts: JSON.stringify(data.concepts),
      })

      await blink.db.seasonMembers.create({
        id: `member_${crypto.randomUUID().slice(0, 8)}`,
        seasonId: newSeason.id,
        userId: user!.id,
        role: 'owner',
        email: user!.email,
        displayName: user!.displayName,
      })

      localStorage.setItem('selected_team_id', teamId)
      return { teamId, seasonId: newSeason.id }
    },
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['team'] })
      toast.success('Season setup complete!', { description: `Welcome to ${variables.seasonName}.` })
      navigate({ to: '/', replace: true })
    },
    onError: (err) => {
      console.error('Onboarding failed', err)
      toast.error('Failed to set up season', { description: (err as any)?.message })
    }
  })

  const toggleConcept = (concept: string) => {
    const currentConcepts = getValues('concepts')
    const isSelected = currentConcepts.includes(concept)
    if (isSelected) {
      setValue('concepts', currentConcepts.filter(c => c !== concept))
    } else {
      if (currentConcepts.length < 5) {
        setValue('concepts', [...currentConcepts, concept])
      } else {
        toast.warn('You can select a maximum of 5 concepts.')
      }
    }
  }

  useEffect(() => {
    async function verifyInvite() {
      if (!inviteToken || !user) {
        if (!inviteToken) setVerifyingInvite(false)
        return
      }
      
      try {
        setVerifyingInvite(true)
        setVerifyError(null)

        const invitations = await blink.db.invitations.list({
          where: { token: inviteToken, status: 'pending' }
        }) as Invitation[]

        if (invitations.length === 0) {
          setVerifyError('This invitation link is invalid or has already been used.')
          return
        }

        const invite = invitations[0]
        const season = await blink.db.seasons.get(invite.seasonId) as Season
        
        if (!season) {
          setVerifyError('The season associated with this invitation no longer exists.')
          return
        }

        const team = await blink.db.teams.get(season.teamId) as Team
        
        if (!team) {
          setVerifyError('The team associated with this invitation no longer exists.')
          return
        }

        setInviteData({
          id: invite.id,
          seasonId: invite.seasonId,
          email: invite.email,
          role: invite.role,
          teamName: team.name,
          seasonName: season.name
        })
      } catch (err) {
        console.error('Invite verification failed', err)
        setVerifyError('Something went wrong while verifying your invitation. Please try again.')
      } finally {
        setVerifyingInvite(false)
      }
    }

    if (user && inviteToken) {
      verifyInvite()
    }
  }, [inviteToken, user])

  const acceptInviteMutation = useMutation({
    mutationFn: async () => {
      if (!inviteData || !user) return
      
      // 1. Add user to season members
      await blink.db.seasonMembers.create({
        id: `member_${crypto.randomUUID().slice(0, 8)}`,
        seasonId: inviteData.seasonId,
        userId: user.id,
        role: inviteData.role,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
      })

      // 2. Mark invite as accepted and set user_id
      await blink.db.invitations.update(inviteData.id, {
        status: 'accepted',
        userId: user.id
      })

      const season = await blink.db.seasons.get(inviteData.seasonId) as Season
      if (season) {
        localStorage.setItem('selected_team_id', season.teamId)
      }
      
      // Wait a tiny bit for DB consistency before navigating
      await new Promise(resolve => setTimeout(resolve, 500))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['team'] })
      toast.success('Invitation accepted!', { description: `You have joined the coaching staff for ${inviteData?.teamName}.` })
      navigate({ to: '/', replace: true })
    },
    onError: (err) => {
      console.error('Accept invite failed', err)
      toast.error('Failed to accept invitation', { description: (err as any)?.message })
    }
  })

  if (verifyError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-destructive/20 shadow-2xl shadow-destructive/5">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Rocket className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Invite Error</CardTitle>
            <CardDescription className="text-base text-destructive">
              {verifyError}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => navigate({ to: '/', replace: true })} 
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (verifyingInvite || acceptInviteMutation.isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground animate-pulse">
            {verifyingInvite ? 'Verifying invitation...' : 'Joining coaching staff...'}
          </p>
        </div>
      </div>
    )
  }

  if (inviteData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 animate-fade-in">
        <Card className="w-full max-w-md border-primary/10 shadow-2xl shadow-primary/5">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Accept Invitation</CardTitle>
            <CardDescription className="text-base">
              You've been invited to join the coaching staff for <span className="font-bold text-foreground">{inviteData.teamName}</span> as an <span className="font-bold text-foreground lowercase">{inviteData.role}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-secondary/20 border border-border/40 space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Season</p>
              <p className="font-semibold">{inviteData.seasonName}</p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => acceptInviteMutation.mutate()} 
                className="w-full h-12 text-base font-bold shadow-xl shadow-primary/20"
                disabled={acceptInviteMutation.isPending}
              >
                {acceptInviteMutation.isPending ? 'Joining...' : 'Accept Invitation'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setInviteData(null)
                  navigate({ to: '/onboarding', search: {}, replace: true })
                }} 
                className="w-full"
                disabled={acceptInviteMutation.isPending}
              >
                Setup my own team
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasTeam = !isAddingNewTeam && !inviteToken && !!existingTeam?.team

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6 animate-fade-in">
      <Card className="w-full max-w-2xl border-primary/10 shadow-2xl shadow-primary/5">
        <CardHeader className="text-center px-4 md:px-6">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg shadow-primary/20">
            <Rocket className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">
            {hasTeam ? `Start a new season for ${existingTeam?.team?.name}` : 'Set up your season'}
          </CardTitle>
          <CardDescription className="text-sm md:text-base">
            {hasTeam
              ? 'Your team is saved. Add a new season to keep coaching.'
              : 'Configure your team and pick the concepts you want to prioritize this season.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {!hasTeam && (
                <Field>
                  <FieldLabel>Team Name</FieldLabel>
                  <Input {...register('teamName')} placeholder="e.g. Gotham Knights" />
                  {errors.teamName && <FieldError>{errors.teamName.message}</FieldError>}
                </Field>
              )}
              <Field>
                <FieldLabel>Season Name</FieldLabel>
                <Input {...register('seasonName')} placeholder="e.g. 2026 Winter Season" />
                {errors.seasonName && <FieldError>{errors.seasonName.message}</FieldError>}
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Season Start
                </FieldLabel>
                <Input type="date" {...register('startDate')} />
                {errors.startDate && <FieldError>{errors.startDate.message}</FieldError>}
              </Field>
              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Season End
                </FieldLabel>
                <Input type="date" {...register('endDate')} />
                {errors.endDate && <FieldError>{errors.endDate.message}</FieldError>}
              </Field>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <FieldLabel>Priority Concepts</FieldLabel>
                <p className="text-xs text-muted-foreground">Select 3–5 concepts to focus on this season.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CONCEPTS.map(concept => (
                  <button
                    key={concept}
                    type="button"
                    onClick={() => toggleConcept(concept)}
                    className={cn(
                      "p-3 text-sm font-medium rounded-lg border transition-all text-center",
                      selectedConcepts.includes(concept)
                        ? "bg-primary/10 border-primary text-primary shadow-sm"
                        : "bg-background border-border hover:border-primary/50 text-muted-foreground"
                    )}
                  >
                    {concept}
                  </button>
                ))}
              </div>
              {errors.concepts && <FieldError>{errors.concepts.message}</FieldError>}
            </div>

            <Button type="submit" className="w-full h-12 text-base font-bold shadow-xl shadow-primary/20" disabled={mutation.isPending}>
              {mutation.isPending ? 'Setting up...' : 'Complete Season Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
