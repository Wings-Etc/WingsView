'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  ChartTooltip,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface SalesTrendData {
  period: string;
  ty: number;
  ly: number;
  ly2?: number;
  ly3?: number;
  ly4?: number;
}

interface SalesTrendChartProps {
  data?: SalesTrendData[];
  yearLabels?: {
    currentYear: string;
    lastYear: string;
    twoYearsAgo?: string;
    threeYearsAgo?: string;
    fourYearsAgo?: string;
  };
  enabledYears?: {
    currentYear: boolean;
    lastYear: boolean;
    twoYearsAgo?: boolean;
    threeYearsAgo?: boolean;
    fourYearsAgo?: boolean;
  };
  onEnabledYearsChange?: (enabledYears: {
    currentYear: boolean;
    lastYear: boolean;
    twoYearsAgo: boolean;
    threeYearsAgo: boolean;
    fourYearsAgo: boolean;
  }) => void;
}

const defaultChartData: SalesTrendData[] = [
];

// currency to M (no decimals beyond 2 places)
const toMillions = (n: number) => `$${(Number(n) / 1_000_000).toFixed(2)}M`;

export function SalesTrendChart({ 
  data, 
  yearLabels, 
  enabledYears,
  onEnabledYearsChange 
}: SalesTrendChartProps) {
  const chartData = data && data.length > 0 ? data : defaultChartData;

  // Default enabled years if not provided
  const defaultEnabledYears = {
    currentYear: true,
    lastYear: true,
    twoYearsAgo: false,
    threeYearsAgo: false,
    fourYearsAgo: false,
    ...enabledYears
  };

  const chartConfig = {
    ty: {
      label: yearLabels?.currentYear || 'This Year',
      color: '#2563eb',
    },
    ly: {
      label: yearLabels?.lastYear || 'Last Year',
      color: '#dc2626',
    },
    ly2: {
      label: yearLabels?.twoYearsAgo || '2 Years Ago',
      color: '#f59e0b',
    },
    ly3: {
      label: yearLabels?.threeYearsAgo || '3 Years Ago',
      color: '#10b981',
    },
    ly4: {
      label: yearLabels?.fourYearsAgo || '4 Years Ago',
      color: '#8b5cf6',
    }
  } as const;

  // Custom tooltip that preserves the color swatch
  function CurrencyTooltip({
    active,
    label,
    payload,
  }: TooltipProps<ValueType, NameType>) {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="rounded-md border bg-background p-2 text-sm shadow-md">
        <div className="mb-1 font-medium">{label}</div>
        <div className="flex flex-col gap-1">
          {payload.map((entry) => {
            const key = String(entry.dataKey ?? '');
            const cfg = (chartConfig as any)[key];
            const name = cfg?.label ?? entry.name ?? key;
            const color = (entry as any).color ?? cfg?.color;

            return (
              <div key={key} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ background: color }}
                />
                <span className="text-muted-foreground">{name}</span>
                <span className="ml-auto tabular-nums">
                  {typeof entry.value === 'number'
                    ? toMillions(entry.value)
                    : toMillions(Number(entry.value ?? 0))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const handleYearToggle = (year: keyof typeof defaultEnabledYears, checked: boolean) => {
    if (onEnabledYearsChange) {
      const newEnabledYears = { ...defaultEnabledYears, [year]: checked };
      onEnabledYearsChange(newEnabledYears);
    }
  };

  return (
    <div className="space-y-4">
      {/* Year Selection Controls */}
      {onEnabledYearsChange && (
        <div className="flex flex-wrap gap-4 items-center text-sm">
          <span className="text-muted-foreground font-medium">Show Years:</span>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="currentYear"
              checked={defaultEnabledYears.currentYear}
              onCheckedChange={(checked) => handleYearToggle('currentYear', checked as boolean)}
            />
            <Label 
              htmlFor="currentYear" 
              className="text-sm cursor-pointer"
              style={{ color: chartConfig.ty.color }}
            >
              {chartConfig.ty.label}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="lastYear"
              checked={defaultEnabledYears.lastYear}
              onCheckedChange={(checked) => handleYearToggle('lastYear', checked as boolean)}
            />
            <Label 
              htmlFor="lastYear" 
              className="text-sm cursor-pointer"
              style={{ color: chartConfig.ly.color }}
            >
              {chartConfig.ly.label}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="twoYearsAgo"
              checked={defaultEnabledYears.twoYearsAgo}
              onCheckedChange={(checked) => handleYearToggle('twoYearsAgo', checked as boolean)}
            />
            <Label 
              htmlFor="twoYearsAgo" 
              className="text-sm cursor-pointer"
              style={{ color: chartConfig.ly2.color }}
            >
              {chartConfig.ly2.label}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="threeYearsAgo"
              checked={defaultEnabledYears.threeYearsAgo}
              onCheckedChange={(checked) => handleYearToggle('threeYearsAgo', checked as boolean)}
            />
            <Label 
              htmlFor="threeYearsAgo" 
              className="text-sm cursor-pointer"
              style={{ color: chartConfig.ly3.color }}
            >
              {chartConfig.ly3.label}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="fourYearsAgo"
              checked={defaultEnabledYears.fourYearsAgo}
              onCheckedChange={(checked) => handleYearToggle('fourYearsAgo', checked as boolean)}
            />
            <Label 
              htmlFor="fourYearsAgo" 
              className="text-sm cursor-pointer"
              style={{ color: chartConfig.ly4.color }}
            >
              {chartConfig.ly4.label}
            </Label>
          </div>
        </div>
      )}

      <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{ left: 12, right: 12 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="period"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: string) => value.slice(0, 3)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: number) => toMillions(value)}
        />

        {/* Tooltip with colored squares */}
        <ChartTooltip content={<CurrencyTooltip />} />

        <ChartLegend content={<ChartLegendContent />} />

        <defs>
          <linearGradient id="fillTy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="fillLy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="fillLy2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="fillLy3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="fillLy4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
          </linearGradient>
        </defs>

        {/* Render areas with individual stackIds so they don't stack on top of each other */}
        {defaultEnabledYears.fourYearsAgo && (
          <Area
            dataKey="ly4"
            type="natural"
            fill="url(#fillLy4)"
            fillOpacity={0.4}
            stroke="#8b5cf6"
            strokeWidth={1}
          />
        )}
        {defaultEnabledYears.threeYearsAgo && (
          <Area
            dataKey="ly3"
            type="natural"
            fill="url(#fillLy3)"
            fillOpacity={0.4}
            stroke="#10b981"
            strokeWidth={1}
          />
        )}
        {defaultEnabledYears.twoYearsAgo && (
          <Area
            dataKey="ly2"
            type="natural"
            fill="url(#fillLy2)"
            fillOpacity={0.4}
            stroke="#f59e0b"
            strokeWidth={2}
          />
        )}
        {defaultEnabledYears.lastYear && (
          <Area
            dataKey="ly"
            type="natural"
            fill="url(#fillLy)"
            fillOpacity={0.4}
            stroke="#dc2626"
            strokeWidth={2}
          />
        )}
        {defaultEnabledYears.currentYear && (
          <Area
            dataKey="ty"
            type="natural"
            fill="url(#fillTy)"
            fillOpacity={0.4}
            stroke="#2563eb"
            strokeWidth={3}
          />
        )}
      </AreaChart>
    </ChartContainer>
    </div>
  );
}
