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
  format?: 'currency' | 'percent' | 'number';
  positiveIsGood?: boolean;
}

export function KpiCard({ title, value, valueLY, format = 'number', positiveIsGood = true }: KpiCardProps) {

  const hasLY = typeof valueLY === 'number';
  const change = hasLY && valueLY !== 0 ? ((value - valueLY) / valueLY) * 100 : 0;
  const changePp = hasLY ? value - valueLY : 0;

  const isPositive = format === 'percent' ? changePp >= 0 : change >= 0;
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
      default:
        return new Intl.NumberFormat('en-US', {
            notation: 'compact',
            compactDisplay: 'short'
        }).format(val);
    }
  };

  const formatTooltipValue = (val: number) => {
    switch(format) {
        case 'currency':
             return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
        case 'percent':
            return `${val.toFixed(2)}%`;
        default:
            return new Intl.NumberFormat('en-US').format(val);
    }
  }
  
  const changeText = format === 'percent' ? `${changePp.toFixed(1)}pp` : `${change.toFixed(1)}%`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
         <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="text-2xl font-bold cursor-pointer">{formatDisplayValue(value)}</div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{formatTooltipValue(value)}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>

        {hasLY ? (
          <p className={`text-xs ${changeColor} flex items-center`}>
            <ChangeIcon className="h-4 w-4 mr-1" />
            {changeText} vs LY
          </p>
        ) : (
             <p className="text-xs text-muted-foreground invisible">No comparison</p>
        )}
      </CardContent>
    </Card>
  );
}
