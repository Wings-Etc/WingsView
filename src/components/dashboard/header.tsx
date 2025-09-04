import { Logo } from '@/components/icons/logo';
import { Filters } from './filters';
import type { StoreInfo } from '@/types';

interface DashboardHeaderProps {
  storeInfo: StoreInfo[];
}

export function DashboardHeader({ storeInfo }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <div className="flex items-center gap-2">
        <Logo />
      </div>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          <Filters storeInfo={storeInfo} />
        </div>
      </div>
    </header>
  );
}
