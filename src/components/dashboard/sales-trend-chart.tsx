'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ChartTooltip, ChartTooltipContent, ChartContainer } from '@/components/ui/chart';

const chartData = [
  { month: 'Jan', ty: 186000, ly: 140000 },
  { month: 'Feb', ty: 205000, ly: 152000 },
  { month: 'Mar', ty: 237000, ly: 165000 },
  { month: 'Apr', ty: 173000, ly: 189000 },
  { month: 'May', ty: 209000, ly: 168000 },
  { month: 'Jun', ty: 214000, ly: 172000 },
  { month: 'Jul', ty: 284000, ly: 198000 },
  { month: 'Aug', ty: 255000, ly: 210000 },
  { month: 'Sep', ty: 220000, ly: 205000 },
  { month: 'Oct', ty: 245000, ly: 223000 },
  { month: 'Nov', ty: 260000, ly: 240000 },
  { month: 'Dec', ty: 305000, ly: 280000 },
];

const chartConfig = {
  ty: {
    label: "This Year",
    color: "hsl(var(--primary))",
  },
  ly: {
    label: "Last Year",
    color: "hsl(var(--muted-foreground))",
  },
};

export function SalesTrendChart() {
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
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `$${Number(value) / 1000}k`}
        />
        <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
        />
        <defs>
          <linearGradient id="fillTy" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-ty)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-ty)"
              stopOpacity={0.1}
            />
          </linearGradient>
          <linearGradient id="fillLy" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-ly)"
              stopOpacity={0.4}
            />
            <stop
              offset="95%"
              stopColor="var(--color-ly)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <Area
          dataKey="ly"
          type="natural"
          fill="url(#fillLy)"
          fillOpacity={0.4}
          stroke="var(--color-ly)"
          stackId="a"
        />
        <Area
          dataKey="ty"
          type="natural"
          fill="url(#fillTy)"
          fillOpacity={0.4}
          stroke="var(--color-ty)"
          stackId="b"
        />
      </AreaChart>
    </ChartContainer>
  );
}
