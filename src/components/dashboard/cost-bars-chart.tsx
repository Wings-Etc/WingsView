"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "January", food: 32.5, alcohol: 22.1 },
  { month: "February", food: 33.1, alcohol: 22.8 },
  { month: "March", food: 31.9, alcohol: 21.9 },
  { month: "April", food: 32.7, alcohol: 23.5 },
  { month: "May", food: 34.2, alcohol: 24.1 },
  { month: "June", food: 33.5, alcohol: 23.2 },
]

const chartConfig = {
  food: {
    label: "Food %",
    color: "hsl(var(--chart-1))",
  },
  alcohol: {
    label: "Alcohol %",
    color: "hsl(var(--chart-2))",
  },
}

export function CostBarsChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dashed" />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="food" fill="var(--color-food)" radius={4} />
        <Bar dataKey="alcohol" fill="var(--color-alcohol)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
