import React from 'react'
import { Card, CardHeader, CardTitle, CardContent, EmptyState } from '@blinkdotnew/ui'
import { Target, ClipboardList, Swords } from 'lucide-react'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { staggerItem } from '../../components/Interactivity'
import { HypeCard } from '../../components/HypeCard'

interface ActivitySummaryProps {
  upcomingGames: any[]
  analyticsGames: any[]
  analyticsReviews: any[]
  nextEvent: any
  onNavigateToEvent: (kind: string, id: string) => void
}

export const ActivitySummary = ({ 
  upcomingGames, 
  analyticsGames, 
  analyticsReviews, 
  nextEvent,
  onNavigateToEvent
}: ActivitySummaryProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <motion.div variants={staggerItem} className="md:col-span-2">
        <HypeCard
          nextGame={upcomingGames[0] ?? null}
          allGames={analyticsGames}
          allReviews={analyticsReviews}
        />
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card className="border-border/50 rounded-[2rem] shadow-xl shadow-black/30 h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-4 h-4 text-primary" />
              Next Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!nextEvent ? (
              <EmptyState
                title="No upcoming activities"
                description="Schedule a practice or game to get started."
                className="py-4"
              />
            ) : nextEvent.kind === 'practice' ? (
              <button
                onClick={() => onNavigateToEvent('practice', nextEvent.data.id)}
                className="w-full text-left space-y-2 hover:bg-secondary/40 p-3 -m-3 rounded-full transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Practice</span>
                </div>
                <p className="font-semibold text-sm text-foreground">{nextEvent.data.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(nextEvent.data.date), 'EEE, MMM d')}
                </p>
              </button>
            ) : (
              <button
                onClick={() => onNavigateToEvent('game', nextEvent.data.id)}
                className="w-full text-left space-y-2 hover:bg-secondary/40 p-3 -m-3 rounded-full transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Game</span>
                </div>
                <p className="font-semibold text-sm text-foreground">vs. {nextEvent.data.opponent}</p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(nextEvent.data.date), 'EEE, MMM d')} · {nextEvent.data.location === 'home' ? 'Home' : 'Away'}
                </p>
              </button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
