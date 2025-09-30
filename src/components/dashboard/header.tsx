import { Logo } from '@/components/icons/logo';
import { Filters } from './filters';
import { DateRange } from "react-day-picker";
import type { StoreInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  storeInfo: StoreInfo[];
  onDateChange?: (dateRange: DateRange | undefined) => void;
  onStoreChange?: (store: string) => void;
  onDistrictChange?: (district: string) => void;
  onTimeframeChange?: (timeframe: string) => void;
  selectedTimeframe?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function DashboardHeader({ 
  storeInfo, 
  onDateChange, 
  onStoreChange, 
  onDistrictChange,
  onTimeframeChange,
  selectedTimeframe,
  onRefresh,
  refreshing = false
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <div className="flex items-center gap-2">
        <Logo />
      </div>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          <Filters 
            storeInfo={storeInfo} 
            onDateChange={onDateChange}
            onStoreChange={onStoreChange}
            onDistrictChange={onDistrictChange}
            onTimeframeChange={onTimeframeChange}
            selectedTimeframe={selectedTimeframe}
          />
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        )}
      </div>
    </header>
  );
}
