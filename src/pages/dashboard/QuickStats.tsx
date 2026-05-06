import React from 'react'
import { Card, CardContent } from '@blinkdotnew/ui'
import { motion } from 'framer-motion'
import { AnimatedCounter, staggerItem } from '../../components/Interactivity'

interface QuickStatsProps {
  wins: number
  losses: number
  ties: number
  completedPractices: number
  completedGamesCount: number
  upcomingCount: number
  consensusCount: number
}

export const QuickStats = ({ 
  wins, 
  losses, 
  ties, 
  completedPractices, 
  completedGamesCount, 
  upcomingCount,
  consensusCount
}: QuickStatsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <motion.div variants={staggerItem}>
        <Card className="border-border/50 rounded-[2rem] shadow-lg shadow-black/20 overflow-hidden active:scale-[0.98] transition-transform">
          <CardContent className="p-6">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Record</p>
            <p className="text-3xl font-black text-foreground mt-1 tabular-nums italic flex items-baseline gap-1">
              <AnimatedCounter value={wins} />
              <span>-</span>
              <AnimatedCounter value={losses} />
              <span>-</span>
              <AnimatedCounter value={ties} />
            </p>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div variants={staggerItem}>
        <Card className="border-border/50 rounded-[2rem] shadow-lg shadow-black/20 overflow-hidden active:scale-[0.98] transition-transform">
          <CardContent className="p-6">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Practices Logged</p>
            <p className="text-3xl font-black text-foreground mt-1 tabular-nums italic">
              <AnimatedCounter value={completedPractices} />
            </p>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div variants={staggerItem}>
        <Card className="border-border/50 rounded-[2rem] shadow-lg shadow-black/20 overflow-hidden active:scale-[0.98] transition-transform">
          <CardContent className="p-6">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Games Played</p>
            <p className="text-3xl font-black text-foreground mt-1 tabular-nums italic">
              <AnimatedCounter value={completedGamesCount} />
            </p>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div variants={staggerItem}>
        <Card className="border-border/50 rounded-[2rem] shadow-lg shadow-black/20 overflow-hidden active:scale-[0.98] transition-transform">
          <CardContent className="p-6">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Upcoming</p>
            <p className="text-3xl font-black text-foreground mt-1 tabular-nums italic">
              <AnimatedCounter value={upcomingCount} />
            </p>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div variants={staggerItem}>
        <Card className="border-primary/20 bg-primary/5 rounded-[2rem] shadow-lg shadow-black/20 overflow-hidden active:scale-[0.98] transition-transform">
          <CardContent className="p-6">
            <p className="text-[10px] uppercase font-bold tracking-widest text-primary opacity-90">Data Strength</p>
            <p className="text-3xl font-black text-primary mt-1 tabular-nums italic">
              <AnimatedCounter value={consensusCount} />
            </p>
            <p className="text-[8px] uppercase font-black text-primary/60 mt-1 tracking-tighter">Total staff reviews</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}