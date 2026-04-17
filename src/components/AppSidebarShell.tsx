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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link, useLocation } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { blink } from '@/blink/client'
import { ViewModeSwitcher } from './ViewModeSwitcher'

const SIDEBAR_KEY = 'sidebar_collapsed'

interface NavItemDef {
  to: string
  icon: ReactNode
  label: string
}

const NAV_ITEMS: NavItemDef[] = [
  { to: '/', icon: <LayoutDashboard className="h-4 w-4" />, label: 'Dashboard' },
  { to: '/calendar', icon: <Calendar className="h-4 w-4" />, label: 'Calendar' },
  { to: '/practices', icon: <FileText className="h-4 w-4" />, label: 'Practices' },
  { to: '/games', icon: <Trophy className="h-4 w-4" />, label: 'Games' },
  { to: '/opponents', icon: <Users className="h-4 w-4" />, label: 'Opponents' },
  { to: '/concepts', icon: <BarChart3 className="h-4 w-4" />, label: 'Concepts' },
  { to: '/trends', icon: <TrendingUp className="h-4 w-4" />, label: 'Trends' },
  { to: '/team', icon: <UserCog className="h-4 w-4" />, label: 'Coaching Staff' },
  { to: '/settings', icon: <Settings className="h-4 w-4" />, label: 'Settings' },
]

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

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U'

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
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggle}
                  className="h-8 w-8 mx-auto flex items-center justify-center rounded-md hover:bg-sidebar-accent transition-colors"
                  aria-label="Expand sidebar"
                >
                  <img
                    src={iqPlusLogoUrl}
                    alt="Blue Line IQ"
                    className="h-7 w-7 object-contain select-none"
                    draggable={false}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <img
                  src={logoUrl}
                  alt="Blue Line IQ"
                  className="h-7 w-auto object-contain object-left select-none"
                  draggable={false}
                />
                <span className="block text-[10px] text-muted-foreground truncate uppercase font-semibold tracking-wider">Coach Pro</span>
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

        {/* ── Nav (only this section scrolls) ───────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1">
          <div className="pb-3">
            <ViewModeSwitcher collapsed={collapsed} />
          </div>
          {!collapsed && (
            <p className="px-3 pt-2 pb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
              Navigation
            </p>
          )}
          {NAV_ITEMS.map(item => (
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
                <div className="h-8 w-8 rounded-full ring-2 ring-primary/20 overflow-hidden cursor-pointer hover:ring-primary/40 transition-all duration-200">
                  <Avatar className="h-full w-full">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="text-xs">
                  <p className="font-bold">{user?.email}</p>
                  <p className="text-muted-foreground">Team Coach</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-bold truncate text-foreground leading-none mb-1">Coach</p>
                <p className="text-[10px] text-muted-foreground truncate leading-none">
                  {user?.email}
                </p>
              </div>
            </div>
          )}

          {/* Expand sidebar (collapsed only) */}
          {collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                  onClick={toggle}
                  aria-label="Expand sidebar"
                >
                  <ChevronsRight className="h-4 w-4 shrink-0" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
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
                  onClick={() => blink.auth.logout()}
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start px-2 gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 group transition-all duration-200"
              onClick={() => blink.auth.logout()}
            >
              <LogOut className="h-4 w-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              <span className="text-xs font-semibold uppercase tracking-wider">Sign out</span>
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
