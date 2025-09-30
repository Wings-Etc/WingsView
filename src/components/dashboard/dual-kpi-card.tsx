import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface DualKpiCardProps {
  title: string;
  leftLabel: string;
  leftValue: number;
  leftValueLY?: number;
  rightLabel: string;
  rightValue: number;
  rightValueLY?: number;
  format?: 'currency' | 'percent' | 'number' | 'minutes';
  positiveIsGood?: boolean;
  isCurrentWeek?: boolean;
  comparisonLabel?: string;
  currentPeriod?: { start: string; end: string };
  lastYearPeriod?: { start: string; end: string };
}

export default function DualKpiCard({ 
  title, 
  leftLabel, 
  leftValue, 
  leftValueLY, 
  rightLabel, 
  rightValue, 
  rightValueLY, 
  format = 'number', 
  positiveIsGood = true,
  isCurrentWeek = false,
  comparisonLabel,
  currentPeriod,
  lastYearPeriod
}: DualKpiCardProps) {

  const formatDisplayValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          notation: 'compact',
          compactDisplay: 'short',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(val);
      case 'percent':
        return `${val.toFixed(1)}%`;
      case 'minutes':
        return `${val.toFixed(1)} min`;
      default:
        return val.toLocaleString();
    }
  };

  const calculateChange = (current: number, lastYear?: number) => {
    const hasLY = typeof lastYear === 'number';
    const change = hasLY && lastYear !== 0 ? ((current - lastYear) / lastYear) * 100 : 0;
    const changePp = hasLY ? current - lastYear : 0;
    const isPositive = change >= 0;
    
    return { hasLY, change, changePp, isPositive };
  };

  const leftStats = calculateChange(leftValue, leftValueLY);
  const rightStats = calculateChange(rightValue, rightValueLY);

  const getChangeColor = (isPositive: boolean) => 
    (isPositive && positiveIsGood) || (!isPositive && !positiveIsGood)
      ? 'text-green-600'
      : 'text-red-600';

  const comparisonText = comparisonLabel || (isCurrentWeek ? 'vs LW' : 'vs LY');
  const labelText = comparisonLabel || (isCurrentWeek ? 'LW' : 'LY');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
        <CardTitle className="text-md font-medium text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Left Value */}
          <div className="text-center">
            <div className="text-s text-muted-foreground">{leftLabel}</div>
            <div className="text-3xl font-bold">{formatDisplayValue(leftValue)}</div>
            {leftStats.hasLY && (
              <div className="text-xs space-y-1">
                <div className="text-muted-foreground text-center">
                  {labelText}: {formatDisplayValue(leftValueLY!)}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className={`${getChangeColor(leftStats.isPositive)} flex items-center justify-center cursor-help`}>
                        {leftStats.isPositive ? (
                          <ArrowUp className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDown className="h-3 w-3 mr-1" />
                        )}
                        {format === 'percent' 
                          ? `${Math.abs(leftStats.change).toFixed(1)}% ${comparisonText}`
                          : `${Math.abs(leftStats.change).toFixed(1)}% ${comparisonText}`
                        }
                      </p>
                    </TooltipTrigger>
                    {currentPeriod && lastYearPeriod && (
                      <TooltipContent>
                        <div className="text-xs">
                          <p><strong>Current:</strong> {currentPeriod.start} - {currentPeriod.end}</p>
                          <p><strong>Last Year:</strong> {lastYearPeriod.start} - {lastYearPeriod.end}</p>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>

          {/* Right Value */}
          <div className="text-center">
            <div className="text-s text-muted-foreground">{rightLabel}</div>
            <div className="text-3xl font-bold">{formatDisplayValue(rightValue)}</div>
            {rightStats.hasLY && (
              <div className="text-xs space-y-1">
                <div className="text-muted-foreground text-center">
                  {labelText}: {formatDisplayValue(rightValueLY!)}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className={`${getChangeColor(rightStats.isPositive)} flex items-center justify-center cursor-help`}>
                        {rightStats.isPositive ? (
                          <ArrowUp className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDown className="h-3 w-3 mr-1" />
                        )}
                        {format === 'percent' 
                          ? `${Math.abs(rightStats.change).toFixed(1)}% ${comparisonText}`
                          : `${Math.abs(rightStats.change).toFixed(1)}% ${comparisonText}`
                        }
                      </p>
                    </TooltipTrigger>
                    {currentPeriod && lastYearPeriod && (
                      <TooltipContent>
                        <div className="text-xs">
                          <p><strong>Current:</strong> {currentPeriod.start} - {currentPeriod.end}</p>
                          <p><strong>Last Year:</strong> {lastYearPeriod.start} - {lastYearPeriod.end}</p>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
