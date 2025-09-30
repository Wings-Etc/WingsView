"use client";

import type { StoreInfo } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, safeNumber, toFixedSafe } from "@/lib/utils";
interface StoreHeatmapProps {
  stores: StoreInfo[];
}

const getColorByRank = (rank: number, totalStores: number) => {
  // Calculate percentile (0 = worst, 1 = best)
  const percentile = (totalStores - rank) / (totalStores - 1);
  
  if (percentile >= 0.9) return "bg-green-700/80 hover:bg-green-700";      // Top 10%
  if (percentile >= 0.75) return "bg-green-600/80 hover:bg-green-600";     // Top 25%
  if (percentile >= 0.6) return "bg-green-500/80 hover:bg-green-500";      // Top 40%
  if (percentile >= 0.4) return "bg-yellow-500/80 hover:bg-yellow-500";    // Middle 40-60%
  if (percentile >= 0.25) return "bg-orange-500/80 hover:bg-orange-500";   // Bottom 25-40%
  if (percentile >= 0.1) return "bg-red-500/80 hover:bg-red-500";          // Bottom 10-25%
  return "bg-red-700/80 hover:bg-red-700";                                 // Bottom 10%
};

export function StoreHeatmap({ stores }: StoreHeatmapProps) {
  // normalize/sanitize each row so render is bulletproof
  const safeStores = (Array.isArray(stores) ? stores : [])
    .filter((s) => s && s.StoreNbr != null)
    .map((s) => {
      const StoreNbr = String(s.StoreNbr ?? "");
      const grossSales = safeNumber((s as any).grossSales, 0);
      return { ...s, StoreNbr, grossSales };
    });

  if (safeStores.length === 0) {
    return (
      <TooltipProvider>
        <div className="text-sm text-muted-foreground">No stores to display</div>
      </TooltipProvider>
    );
  }

  // Sort stores by gross sales to calculate rankings
  const sortedByPerformance = [...safeStores].sort((a, b) => b.grossSales - a.grossSales);
  
  // Create a ranking map
  const rankingMap = new Map<string, number>();
  sortedByPerformance.forEach((store, index) => {
    rankingMap.set(store.StoreNbr, index + 1); // Rank 1 = best performer
  });

  return (
    <TooltipProvider>
      <div className="grid grid-cols-14 gap-1.5">
        {safeStores.map((store) => {
          const grossSales = safeNumber(store.grossSales, 0); // always a number
          const rank = rankingMap.get(store.StoreNbr) || safeStores.length;
          
          // Extract just the numeric part from store number (handle "we123" -> "123")
          const storeStr = String(store.StoreNbr);
          const match = storeStr.match(/\d+/);
          const displayNum = match ? match[0] : storeStr;

          return (
            <Tooltip key={store.StoreNbr}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex h-14 w-14 cursor-pointer items-center justify-center rounded-sm text-xs font-semibold text-white transition-colors",
                    getColorByRank(rank, safeStores.length)
                  )}
                >
                  {displayNum}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Store #{displayNum}</p>
                <p>Gross Sales: ${Math.round(grossSales).toLocaleString('en-US')}</p>
                <p>Rank: #{rank} of {safeStores.length}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}