/**
 * Collapsible SaaS sidebar — expands to 15rem, collapses to 3rem (icon-only).
 * State is persisted to localStorage. Tooltips appear automatically when collapsed.
 *
 * NOTE: We bypass @blinkdotnew/ui <Sidebar> because it wraps all children in a
 * single overflow-y-auto div, making flex-1/shrink-0 on children no-ops.
 * This native flex-col implementation gives full layout control.
 */
import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import {
  Avatar,
  AvatarFallback,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@blinkdotnew/ui'
import logoUrl from '@/assets/blue-line-iq-logo.svg'
import iqPlusLogoUrl from '@/assets/iq-plus-logo.svg'
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Trophy,
  Users,
  BarChart3,
  TrendingUp,
  Settings,
  UserCog,
  LogOut,
  PanelLeft,
  ChevronsRight,
  Plus,
  ChevronDown,
  Contact,
  Library,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { useTeam } from '@/hooks/useTeam'
import { useTeamPreferences } from '@/hooks/usePreferences'
import { useDemoMode } from '@/hooks/useDemoData'
import { blink } from '@/blink/client'
import { ViewModeSwitcher } from './ViewModeSwitcher'

const SIDEBAR_KEY = 'sidebar_collapsed'

interface NavItemDef {
  to: string
  icon: ReactNode
  label: string
}

function NavItem({ item, collapsed }: { item: NavItemDef; collapsed: boolean }) {
  const location = useLocation()
  const active = location.pathname === item.to

  const link = (
    <Link
      to={item.to}
      className={cn(
        'flex items-center gap-2.5 rounded-md text-sm transition-all duration-200 cursor-pointer',
        collapsed ? 'justify-center w-8 h-8 mx-auto' : 'px-3 py-2 w-full',
        active
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      <span className={cn('shrink-0', active && 'text-primary')}>{item.icon}</span>
      {!collapsed && <span className="truncate flex-1">{item.label}</span>}
      {!collapsed && active && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
    </Link>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className="bg-popover text-popover-foreground border-border">
        {item.label}
      </TooltipContent>
    </Tooltip>
  )
}

export function AppSidebarShell() {
  const { user } = useAuth()
  const { data: teamData, switchTeam } = useTeam()
  const [teamPrefs] = useTeamPreferences(teamData?.team?.id)
  const { isDemo, exitDemo } = useDemoMode()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(SIDEBAR_KEY) === 'true'
  })

  const toggle = useCallback(() => {
    setCollapsed(v => {
      const next = !v
      localStorage.setItem(SIDEBAR_KEY, String(next))
      return next
    })
  }, [])

  const userInitial = isDemo ? 'D' : (user?.email?.charAt(0).toUpperCase() || 'U')
  const teams = teamData?.teams ?? []
  const currentTeam = teamData?.team

  const navItems = [
    { to: '/', icon: <LayoutDashboard className="h-4 w-4" />, label: 'Dashboard' },
    { to: '/calendar', icon: <Calendar className="h-4 w-4" />, label: 'Calendar' },
    { to: '/practices', icon: <FileText className="h-4 w-4" />, label: 'Practices' },
    { to: '/games', icon: <Trophy className="h-4 w-4" />, label: 'Games' },
    ...(teamPrefs.enableAttendance ? [{ to: '/roster', icon: <Contact className="h-4 w-4" />, label: 'Roster' }] : []),
    ...(teamPrefs.enableAttendance ? [{ to: '/drills', icon: <Library className="h-4 w-4" />, label: 'Drill Library' }] : []),
    { to: '/opponents', icon: <Users className="h-4 w-4" />, label: 'Opponents' },
    { to: '/concepts', icon: <BarChart3 className="h-4 w-4" />, label: 'Concepts' },
    { to: '/trends', icon: <TrendingUp className="h-4 w-4" />, label: 'Trends' },
    { to: '/team', icon: <UserCog className="h-4 w-4" />, label: 'Coaching Staff' },
    { to: '/settings', icon: <Settings className="h-4 w-4" />, label: 'Settings' },
  ]

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          'flex flex-col h-full bg-sidebar border-r border-sidebar-border overflow-hidden',
          'transition-[width] duration-300 ease-in-out shrink-0',
          collapsed ? 'w-[4rem]' : 'w-[16.5rem]'
        )}
      >
        {/* ── Header ────────────────────────────────────── */}
        <div
          className={cn(
            'flex items-center gap-3 shrink-0 border-b border-sidebar-border h-[64px] px-4',
            collapsed && 'justify-center px-2',
            isDemo && 'bg-amber-500/10 border-amber-500/20'
          )}
        >
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div onClick={exitDemo} className={cn("cursor-pointer flex items-center justify-center", isDemo && "text-amber-500")}>
                  <img
                    src={iqPlusLogoUrl}
                    alt="Blue Line IQ"
                    className="h-7 w-7 mx-auto object-contain select-none"
                    draggable={false}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">{isDemo ? 'Exit Demo Mode' : 'Blue Line IQ'}</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5 justify-center -ml-2">
                <img
                  src={logoUrl}
                  alt="Blue Line IQ"
                  className="h-7 w-auto object-contain select-none scale-110"
                  draggable={false}
                />
                {isDemo && (
                  <button
                    onClick={exitDemo}
                    className="text-[9px] text-amber-500 font-bold uppercase tracking-tighter hover:underline text-center"
                  >
                    Demo Mode · Exit
                  </button>
                )}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                    onClick={toggle}
                  >
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Collapse sidebar</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* ── Team Switcher ──────────────────────────────── */}
        {!collapsed && (
          <div className="px-3 pt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-between gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-sidebar-border transition-colors group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex flex-col text-left min-w-0">
                      <span className="text-xs font-bold text-foreground truncate">{currentTeam?.name ?? 'Select Team'}</span>
                      <span className="text-[10px] text-muted-foreground truncate uppercase tracking-tight">
                        {teamData?.season?.name ?? 'No active season'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[14.5rem] bg-popover border-border">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-3 py-2">
                  Switch Team
                </DropdownMenuLabel>
                {teams.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors',
                      t.id === currentTeam?.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                    onClick={() => switchTeam(t.id)}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="flex-1 truncate">{t.name}</span>
                    {t.id === currentTeam?.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer text-primary hover:bg-primary/5"
                  onClick={() => navigate({ to: '/onboarding', search: { mode: 'new_team' } })}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Team</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* ── Nav (only this section scrolls) ───────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1">
          {collapsed && (
            <div className="pb-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggle}
                    aria-label="Expand sidebar"
                    className="h-8 w-8 mx-auto flex items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30 hover:bg-primary/25 hover:ring-primary/50 transition-all"
                  >
                    <ChevronsRight className="h-4 w-4 shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Expand sidebar</TooltipContent>
              </Tooltip>
            </div>
          )}
          <div className="pb-3">
            <ViewModeSwitcher collapsed={collapsed} />
          </div>
          {!collapsed && (
            <p className="px-3 pt-2 pb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
              Navigation
            </p>
          )}
          {navItems.map(item => (
            <NavItem key={item.to} item={item} collapsed={collapsed} />
          ))}
        </div>

        {/* ── Footer (always pinned to bottom) ──────────── */}
        <div
          className={cn(
            'shrink-0 border-t border-sidebar-border bg-sidebar/50 backdrop-blur-sm',
            collapsed ? 'flex flex-col items-center gap-2 p-3' : 'p-4 space-y-3'
          )}
        >
          {/* User row */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "h-8 w-8 rounded-full ring-2 overflow-hidden cursor-pointer transition-all duration-200",
                  isDemo ? "ring-amber-500/40 hover:ring-amber-500/60" : "ring-primary/20 hover:ring-primary/40"
                )}>
                  <Avatar className="h-full w-full">
                    <AvatarFallback className={cn(
                      "text-[10px] font-bold",
                      isDemo ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                    )}>
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="text-xs">
                  <p className="font-bold">{isDemo ? 'Demo User' : (user?.email || 'Guest')}</p>
                  <p className="text-muted-foreground">{isDemo ? 'Viewing Chicago Blackhawks' : 'Team Coach'}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className={cn(
              "flex items-center gap-3 p-2 rounded-xl border transition-all duration-200",
              isDemo ? "bg-amber-500/5 border-amber-500/10" : "bg-sidebar-accent/50 border-sidebar-border"
            )}>
              <Avatar className={cn(
                "h-8 w-8 ring-2",
                isDemo ? "ring-amber-500/20" : "ring-primary/20"
              )}>
                <AvatarFallback className={cn(
                  "text-xs font-bold",
                  isDemo ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                )}>
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-bold truncate text-foreground leading-none mb-1">
                  {isDemo ? 'Demo Coach' : 'Coach'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate leading-none">
                  {isDemo ? 'demo@bluelineiq.com' : (user?.email || 'Not signed in')}
                </p>
              </div>
            </div>
          )}

          {/* Sign out */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={isDemo ? exitDemo : () => blink.auth.logout()}
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{isDemo ? 'Exit Demo' : 'Sign out'}</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start px-2 gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 group transition-all duration-200"
              onClick={isDemo ? exitDemo : () => blink.auth.logout()}
            >
              <LogOut className="h-4 w-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {isDemo ? 'Exit Demo' : 'Sign out'}
              </span>
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}