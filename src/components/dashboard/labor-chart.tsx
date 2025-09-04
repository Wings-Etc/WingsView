"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

const chartData = [
    { date: "Apr 1", manager: 4, server: 9, kitchen: 5, other: 3 },
    { date: "Apr 2", manager: 4, server: 8, kitchen: 6, other: 3 },
    { date: "Apr 3", manager: 4.5, server: 8.5, kitchen: 5.5, other: 3.5 },
    { date: "Apr 4", manager: 4.2, server: 9.2, kitchen: 5.2, other: 3.2 },
    { date: "Apr 5", manager: 4.8, server: 8, kitchen: 6, other: 3 },
    { date: "Apr 6", manager: 5, server: 9.5, kitchen: 5.8, other: 3.5 },
    { date: "Apr 7", manager: 4.5, server: 9, kitchen: 5, other: 3 },
];


const chartConfig = {
  manager: {
    label: "Manager",
    color: "hsl(var(--chart-1))",
  },
  server: {
    label: "Server",
    color: "hsl(var(--chart-2))",
  },
  kitchen: {
    label: "Kitchen",
    color: "hsl(var(--chart-3))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-4))",
  },
}

export function LaborChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${value}%`}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          dataKey="manager"
          type="natural"
          fill="var(--color-manager)"
          fillOpacity={0.8}
          stroke="var(--color-manager)"
          stackId="a"
        />
        <Area
          dataKey="server"
          type="natural"
          fill="var(--color-server)"
          fillOpacity={0.8}
          stroke="var(--color-server)"
          stackId="a"
        />
        <Area
          dataKey="kitchen"
          type="natural"
          fill="var(--color-kitchen)"
          fillOpacity={0.8}
          stroke="var(--color-kitchen)"
          stackId="a"
        />
        <Area
          dataKey="other"
          type="natural"
          fill="var(--color-other)"
          fillOpacity={0.8}
          stroke="var(--color-other)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  )
}
