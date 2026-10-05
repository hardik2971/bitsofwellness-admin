"use client"

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

export type DayPoint = { day: string; users: number; revenue: number; orders: number }

const config = {
  users: { label: "New users", color: "var(--chart-1)" },
  revenue: { label: "Revenue (₹)", color: "var(--chart-2)" },
} satisfies ChartConfig

export function DashboardCharts({ data }: { data: DayPoint[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>New users</CardTitle>
          <CardDescription>Sign-ups from the app, last 14 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={config} className="h-64 w-full">
            <AreaChart data={data} margin={{ left: 0, right: 8 }}>
              <defs>
                <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-users)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-users)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area dataKey="users" type="monotone" stroke="var(--color-users)" strokeWidth={2} fill="url(#fillUsers)" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Store revenue</CardTitle>
          <CardDescription>Order value per day, last 14 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={config} className="h-64 w-full">
            <BarChart data={data} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
              <YAxis tickLine={false} axisLine={false} width={44} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
