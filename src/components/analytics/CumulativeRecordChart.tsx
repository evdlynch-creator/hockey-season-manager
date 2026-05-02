import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@blinkdotnew/ui'
import { DarkTooltip } from './AnalyticsTooltip'

const EMERALD = '#10B981'
const RED = '#EF4444'
const MUTED = '#8A8A8E'

interface CumulativeRecordChartProps {
  data: any[]
}

export function CumulativeRecordChart({ data }: CumulativeRecordChartProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base">Cumulative Record</CardTitle>
        <CardDescription className="text-xs">How your W-L-T stacks up over the season.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-sm text-muted-foreground italic">No completed games yet.</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="hsl(0 0% 15%)" strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke={MUTED} 
                  tick={{ fontSize: 11, fill: MUTED }} 
                  tickLine={false} 
                  axisLine={{ stroke: 'hsl(0 0% 15%)' }} 
                />
                <YAxis 
                  stroke={MUTED} 
                  tick={{ fontSize: 11, fill: MUTED }} 
                  tickLine={false} 
                  axisLine={{ stroke: 'hsl(0 0% 15%)' }} 
                  width={28} 
                  allowDecimals={false} 
                />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'hsl(0 0% 10%)' }} />
                <Bar dataKey="Wins" stackId="a" fill={EMERALD} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Ties" stackId="a" fill={MUTED} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Losses" stackId="a" fill={RED} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
