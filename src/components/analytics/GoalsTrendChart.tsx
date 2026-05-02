import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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

interface GoalsTrendChartProps {
  data: any[]
}

export function GoalsTrendChart({ data }: GoalsTrendChartProps) {
  return (
    <Card className="lg:col-span-2 border-border bg-card rounded-[2rem]">
      <CardHeader>
        <CardTitle className="text-base">Goals Per Game</CardTitle>
        <CardDescription className="text-xs">Scoring trend across completed games.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-sm text-muted-foreground italic">No completed games yet.</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id="gf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={EMERALD} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={EMERALD} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={RED} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={RED} stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Tooltip content={<DarkTooltip />} cursor={{ stroke: MUTED, strokeDasharray: 3 }} />
                <Area name="Goals For" type="monotone" dataKey="Goals For" stroke={EMERALD} strokeWidth={2} fill="url(#gf)" />
                <Area name="Goals Against" type="monotone" dataKey="Goals Against" stroke={RED} strokeWidth={2} fill="url(#ga)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
