"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, TooltipProps } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"

interface CostChartData {
  period: string;
  food: number;
  beer: number;
  liquor: number;
}

interface CostBarsChartProps {
  data?: CostChartData[];
}

const chartConfig = {
  food: { label: "Food", color: "hsl(var(--chart-1))" },
  beer: { label: "Beer", color: "hsl(var(--chart-2))" },
  liquor: { label: "Liquor", color: "hsl(var(--chart-3))" },
} as const;

// Custom tooltip that appends "%" and keeps the color swatch
function PercentTooltip({
  active,
  label,
  payload,
}: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border bg-background p-2 shadow-md">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            Period
          </span>
          <span className="font-bold text-muted-foreground">{label}</span>
        </div>
      </div>
      <div className="grid gap-2">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {chartConfig[entry.dataKey as keyof typeof chartConfig]?.label}
            </span>
            <span className="font-mono font-bold tabular-nums text-muted-foreground">
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CostBarsChart({ data }: CostBarsChartProps) {
  // Check if we have valid data
  if (!data || data.length === 0) {
    return (
      <div className="min-h-[200px] w-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No Cost Data Available</p>
          <p className="text-sm mt-1">Cost data will appear here when available for the selected period.</p>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <AreaChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="period"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => `${value}%`}
        />
        <ChartTooltip content={<PercentTooltip />} />
        <ChartLegend content={<ChartLegendContent />} />

        <Area
          dataKey="food"
          type="natural"
          fill="var(--color-food)"
          fillOpacity={0.8}
          stroke="var(--color-food)"
          stackId="a"
        />
        <Area
          dataKey="beer"
          type="natural"
          fill="var(--color-beer)"
          fillOpacity={0.8}
          stroke="var(--color-beer)"
          stackId="a"
        />
        <Area
          dataKey="liquor"
          type="natural"
          fill="var(--color-liquor)"
          fillOpacity={0.8}
          stroke="var(--color-liquor)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  )
}
