"use client"

import { Bar, Line, ComposedChart, CartesianGrid, XAxis, YAxis, TooltipProps } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  // ChartTooltipContent, // not needed now
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"

interface LaborData {
  state: string;
  [month: string]: string | number; // Dynamic month properties
}

interface LaborChartProps {
  data?: LaborData[];
}

// Default fallback data with sample states and months
const defaultChartData = [
];

// Function to generate dynamic chart config based on available months
const generateChartConfig = (data: LaborData[]) => {
  const months = new Set<string>();
  
  // Extract all month keys (excluding 'state')
  data.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key !== 'state') {
        months.add(key);
      }
    });
  });

  const monthsArray = Array.from(months).sort((a, b) => {
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthOrder.indexOf(a) - monthOrder.indexOf(b);
  });
  
  const config: any = {};
  
  // Generate colors for each month
  monthsArray.forEach((month, index) => {
    config[month] = {
      label: month,
      color: `hsl(var(--chart-${(index % 5) + 1}))` // Cycle through chart colors
    };
  });

  // Add trendline config
  config.avgTrend = {
    label: "Average Trend",
    color: "hsl(var(--destructive))", // Use a distinct color for trendline
  };

  return { config, months: monthsArray };
};

// Custom tooltip that appends "%" and keeps the color swatch
function PercentTooltip({
  active,
  label,
  payload,
  chartConfig,
}: TooltipProps<ValueType, NameType> & { chartConfig: any }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-md border bg-background p-2 text-sm shadow-md">
      <div className="mb-1 font-medium">{label}</div>
      <div className="flex flex-col gap-1">
        {payload.map((entry) => {
          const key = String(entry.dataKey ?? "");
          const cfg = chartConfig[key];
          const name = cfg?.label ?? entry.name ?? key;
          
          return (
            <div key={key} className="flex items-center gap-2">
              {/* color square */}
              <span
                className="h-2 w-2 rounded-sm"
                style={{ background: entry.color }}
              />
              <span className="text-muted-foreground">{name}</span>
              <span className="ml-auto tabular-nums">
                {typeof entry.value === "number" ? `${entry.value}%` : `${entry.value ?? ""}%`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LaborChart({ data }: LaborChartProps) {
  const chartData = data && data.length > 0 ? data : defaultChartData;
  const { config: chartConfig, months } = generateChartConfig(chartData);

  // Calculate average trendline data and sort by average (lowest to highest)
  const chartDataWithTrend = chartData.map(item => {
    // Calculate average across all months for this state
    const monthValues = months.map(month => (item[month] as number) || 0).filter(val => val > 0);
    const avgTrend = monthValues.length > 0 ? monthValues.reduce((sum, val) => sum + val, 0) / monthValues.length : 0;
    
    return {
      ...item,
      avgTrend: Number(avgTrend.toFixed(1))
    };
  }).sort((a, b) => a.avgTrend - b.avgTrend); // Sort by average labor % (lowest to highest)

  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <ComposedChart
        accessibilityLayer
        data={chartDataWithTrend}
        margin={{ left: 12, right: 12 }}
        maxBarSize={60}
        barCategoryGap="10%"
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="state"
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
        <ChartTooltip content={<PercentTooltip chartConfig={chartConfig} />} />
        <ChartLegend content={<ChartLegendContent />} />
        
        {/* Render a Bar for each month */}
        {months.map((month) => (
          <Bar
            key={month}
            dataKey={month}
            fill={`var(--color-${month})`}
            radius={4}
          />
        ))}
        
        {/* Add trendline */}
        <Line
          type="monotone"
          dataKey="avgTrend"
          stroke="var(--color-avgTrend)"
          strokeWidth={3}
          dot={{ fill: "var(--color-avgTrend)", strokeWidth: 2, r: 4 }}
          connectNulls={false}
        />
      </ComposedChart>
    </ChartContainer>
  )
}
