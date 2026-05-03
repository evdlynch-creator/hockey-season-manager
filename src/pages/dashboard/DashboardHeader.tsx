import React from 'react'
import { Plus } from 'lucide-react'
import { Button, Badge } from '@blinkdotnew/ui'
import { motion } from 'framer-motion'
import { MagneticButton, staggerItem } from '../../components/Interactivity'

interface DashboardHeaderProps {
  teamName: string
  seasonName: string
  logoUrl?: string
  onPracticeClick: () => void
  onGameClick: () => void
}

export const DashboardHeader = ({ teamName, seasonName, logoUrl, onPracticeClick, onGameClick }: DashboardHeaderProps) => {
  return (
    <motion.div variants={staggerItem} className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
      <div className="flex items-center gap-4">
        {logoUrl && (
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 border border-border/50 p-2 flex items-center justify-center shrink-0">
            <img src={logoUrl} alt={teamName} className="w-full h-full object-contain" />
          </div>
        )}
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{teamName}</h1>
          <div className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 rounded-full">
              {seasonName}
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <MagneticButton strength={20}>
          <Button variant="outline" className="gap-2 w-full md:w-auto rounded-full" onClick={onPracticeClick}>
            <Plus className="w-4 h-4" />
            Practice
          </Button>
        </MagneticButton>
        <MagneticButton strength={20}>
          <Button className="gap-2 shadow-lg shadow-primary/20 w-full md:w-auto rounded-full" onClick={onGameClick}>
            <Plus className="w-4 h-4" />
            Game
          </Button>
        </MagneticButton>
      </div>
    </motion.div>
  )
}