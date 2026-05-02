import React from 'react'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@blinkdotnew/ui'
import { DarkTooltip } from './AnalyticsTooltip'

const AMBER = '#F59E0B'
const MUTED = '#8A8A8E'

interface ConceptRadarChartProps {
  data: any[]
}

export function ConceptRadarChart({ data }: ConceptRadarChartProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base">Concept Health</CardTitle>
        <CardDescription className="text-xs">Latest rating across all 6 core concepts.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius={80}>
              <PolarGrid stroke="hsl(0 0% 18%)" />
              <PolarAngleAxis dataKey="concept" tick={{ fontSize: 10, fill: MUTED }} />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 5]} 
                tick={{ fontSize: 9, fill: MUTED }} 
                stroke="hsl(0 0% 18%)" 
              />
              <Radar 
                name="Rating" 
                dataKey="rating" 
                stroke={AMBER} 
                fill={AMBER} 
                fillOpacity={0.35} 
              />
              <Tooltip content={<DarkTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
