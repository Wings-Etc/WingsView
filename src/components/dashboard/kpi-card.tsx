import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface KpiCardProps {
  title: string;
  value: number;
  valueLY?: number;
  format?: 'currency' | 'percent' | 'number' | 'minutes';
  positiveIsGood?: boolean;
  isCurrentWeek?: boolean;
  comparisonLabel?: string;
  currentPeriod?: { start: string; end: string };
  lastYearPeriod?: { start: string; end: string };
}

export function KpiCard({ 
  title, 
  value, 
  valueLY, 
  format = 'number', 
  positiveIsGood = true, 
  isCurrentWeek = false,
  comparisonLabel,
  currentPeriod,
  lastYearPeriod
}: KpiCardProps) {

  const hasLY = typeof valueLY === 'number';
  const change = hasLY && valueLY !== 0 ? ((value - valueLY) / valueLY) * 100 : 0;
  const changePp = hasLY ? value - valueLY : 0;

  const isPositive = change >= 0;
  const changeColor = (isPositive && positiveIsGood) || (!isPositive && !positiveIsGood)
    ? 'text-green-600'
    : 'text-red-600';
  const ChangeIcon = isPositive ? ArrowUp : ArrowDown;

  const formatDisplayValue = (val: number) => {
    switch(format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: 'compact',
            compactDisplay: 'short',
            maximumFractionDigits: 2
        }).format(val);
      case 'percent':
        return `${val.toFixed(1)}%`;
      case 'minutes':
        return `${val.toFixed(1)} min`;
      default:
        return new Intl.NumberFormat('en-US', {
            notation: 'compact',
            compactDisplay: 'short',
            maximumFractionDigits: 1,
            minimumFractionDigits: 1
        }).format(val);
    }
  };

  const formatTooltipValue = (val: number) => {
    switch(format) {
        case 'currency':
             return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
        case 'percent':
            return `${val.toFixed(2)}%`;
        case 'minutes':
            return `${val.toFixed(2)} minutes`;
        default:
            return new Intl.NumberFormat('en-US').format(val);
    }
  }
  
  const changeText = `${Math.abs(change).toFixed(1)}%`;
  const comparisonText = comparisonLabel || (isCurrentWeek ? 'vs LW' : 'vs LY');
  const labelText = comparisonLabel || (isCurrentWeek ? 'LW' : 'LY');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
        <CardTitle className="text-md font-medium text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="text-3xl font-bold">{formatDisplayValue(value)}</div>

        {hasLY ? (
          <div className="text-xs space-y-1">
            <div className="text-muted-foreground text-center">
              {labelText}: {formatDisplayValue(valueLY!)}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className={`${changeColor} flex items-center justify-center cursor-help`}>
                    <ChangeIcon className="h-4 w-4 mr-1" />
                    {changeText} {comparisonText}
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
        ) : (
             <p className="text-xs text-muted-foreground invisible">No comparison</p>
        )}
      </CardContent>
    </Card>
  );
}
