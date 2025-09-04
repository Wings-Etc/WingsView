"use client";

import type { StoreInfo } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface StoreHeatmapProps {
  stores: StoreInfo[];
}

const getColor = (value: number) => {
  if (value > 5) return "bg-green-700/80 hover:bg-green-700";
  if (value > 2) return "bg-green-600/80 hover:bg-green-600";
  if (value > 0) return "bg-green-500/80 hover:bg-green-500";
  if (value > -2) return "bg-red-500/80 hover:bg-red-500";
  if (value > -5) return "bg-red-600/80 hover:bg-red-600";
  return "bg-red-700/80 hover:bg-red-700";
};

export function StoreHeatmap({ stores }: StoreHeatmapProps) {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-10 gap-1.5">
        {stores.map((store) => (
          <Tooltip key={store.StoreNbr}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm text-xs font-semibold text-white transition-colors",
                  getColor(store.compSales)
                )}
              >
                {store.StoreNbr.slice(-2)}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Store #{store.StoreNbr}</p>
              <p>Comp Sales: {store.compSales.toFixed(1)}%</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
