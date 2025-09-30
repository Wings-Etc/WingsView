"use client";

import * as React from "react";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { getFiscalYTD, getCurrentFiscalYear, getPreviousFiscalYear, getCurrentWeek, getLastWeek, getFiscalMonthToDate, getCurrentFiscalMonth, getPreviousFiscalMonth } from "@/lib/fiscal-dates";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { StoreInfo } from "@/types";
import { Separator } from "../ui/separator";

type Props = {
  storeInfo: StoreInfo[] | Record<string, StoreInfo> | null | undefined;
  className?: string;
  onDateChange?: (dateRange: DateRange | undefined) => void;
  onStoreChange?: (store: string) => void;
  onDistrictChange?: (district: string) => void;
  onTimeframeChange?: (timeframe: string) => void;
  selectedTimeframe?: string;
};

function normalizeStores(data: Props["storeInfo"]): StoreInfo[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object") return Object.values(data);
  return [];
}

export function Filters({ storeInfo, className, onDateChange, onStoreChange, onDistrictChange, onTimeframeChange, selectedTimeframe = 'monthToDate' }: Props) {
  // Handle API response shape: [page, total, hasNext, stores[]]
  const stores = React.useMemo(() => {
    let arr: any[] = [];
    
    // Check if storeInfo is array with stores as 4th element
    if (Array.isArray(storeInfo) && storeInfo.length >= 4 && Array.isArray(storeInfo[3])) {
      arr = storeInfo[3];
    } else if (storeInfo && typeof storeInfo === "object" && "stores" in storeInfo && Array.isArray((storeInfo as any).stores)) {
      arr = (storeInfo as any).stores;
    } else if (Array.isArray(storeInfo)) {
      arr = storeInfo;
    } else {
      arr = normalizeStores(storeInfo);
    }
    
    const processed = arr
      .filter((s) => s && (s.StoreNbr != null || s.StoreNumber != null))
      .map((s) => ({
        ...s,
        StoreNbr: String(s.StoreNbr || s.StoreNumber || s.ID || ''),
        District: s.District ? String(s.District) : undefined,
      }));
    return processed;
  }, [storeInfo]);

  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    const fiscalMTD = getFiscalMonthToDate();
    return {
      from: fiscalMTD.start,
      to: fiscalMTD.end,
    };
  });
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  // distinct, non-empty districts
  const districts = React.useMemo(() => {
    const result = Array.from(new Set(stores.map((s) => s.District).filter(Boolean))) as string[];
    return result;
  }, [stores]);

  const [selectedDistrict, setSelectedDistrict] = React.useState<string>("all");
  const [selectedStore, setSelectedStore] = React.useState<string>("all");

  // Call onDateChange with initial YTD date when component mounts
  React.useEffect(() => {
    onDateChange?.(date);
  }, [onDateChange]); // Only run once on mount

  const storesInDistrict = React.useMemo(() => {
    const pool =
      selectedDistrict === "all"
        ? stores
        : stores.filter((s) => s.District === selectedDistrict);
    // drop rows that somehow still lack StoreNbr
    return pool.filter((s) => s.StoreNbr && s.StoreNbr !== "undefined");
  }, [stores, selectedDistrict]);

  const setPresetDate = (preset: "currentWeek" | "lastWeek" | "currentMonth" | "lastMonth" | "monthToDate" | "last30" | "thisYear" | "lastYear") => {
    const today = new Date();
    let from = today;
    let to = today;

    switch (preset) {
      case "currentWeek":
        const currentWeek = getCurrentWeek();
        from = currentWeek.start;
        to = currentWeek.end;
        break;
      case "lastWeek":
        const lastWeek = getLastWeek();
        from = lastWeek.start;
        to = lastWeek.end;
        break;
      case "currentMonth":
        const currentMonth = getCurrentFiscalMonth();
        from = currentMonth.start;
        to = currentMonth.end;
        break;
      case "lastMonth":
        const lastMonth = getPreviousFiscalMonth();
        from = lastMonth.start;
        to = lastMonth.end;
        break;
      case "monthToDate":
        const monthToDate = getFiscalMonthToDate();
        from = monthToDate.start;
        to = monthToDate.end;
        break;
      case "last30":
        from = addDays(today, -30);
        break;
      case "thisYear":
        const fiscalYTD = getFiscalYTD();
        from = fiscalYTD.start;
        to = fiscalYTD.end;
        break;
      case "lastYear":
        const previousFY = getPreviousFiscalYear();
        from = previousFY.start;
        to = previousFY.end;
        break;
    }
    const newDate = { from, to };
    setDate(newDate);
    onDateChange?.(newDate);
    onTimeframeChange?.(preset);
    setPopoverOpen(false);
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {/* District select */}
      <Select
        value={selectedDistrict}
        onValueChange={(v) => {
          setSelectedDistrict(v);
          setSelectedStore("all");
          onDistrictChange?.(v);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Districts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem key="d-all" value="all">
        All Districts
          </SelectItem>
          {[...districts].sort((a, b) => String(a).localeCompare(String(b))).map((d) => {
        const dv = String(d); // guaranteed non-empty by filter(Boolean)
        return (
          <SelectItem key={`d-${dv}`} value={dv}>
            {dv}
          </SelectItem>
        );
          })}
        </SelectContent>
      </Select>

      {/* Store select */}
      <Select
        value={selectedStore}
        onValueChange={(v) => {
          setSelectedStore(v);
          onStoreChange?.(v);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Stores" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem key="s-all" value="all">
            All Stores
          </SelectItem>
          {storesInDistrict.map((s) => {
            const storeNbr = String(s.StoreNbr);
            // Remove "we" prefix from store number for display (case insensitive)
            const cleanStoreNbr = storeNbr.replace(/^we/i, '');
            return (
              <SelectItem key={`s-${storeNbr}`} value={storeNbr}>
                #{cleanStoreNbr}
                {s.StoreName ? ` — ${s.StoreName}` : ""}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Date range */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(newDate) => {
              setDate(newDate);
              onDateChange?.(newDate);
              // When user manually selects dates, clear the timeframe preset selection
              onTimeframeChange?.('custom');
            }}
            numberOfMonths={2}
          />
          <div className="flex flex-col border-l p-2 space-y-2">
            <Button 
              variant={selectedTimeframe === 'monthToDate' ? 'default' : 'ghost'} 
              className="justify-start" 
              onClick={() => setPresetDate("monthToDate")}
            >
              This Month
            </Button>
            <Button 
              variant={selectedTimeframe === 'lastMonth' ? 'default' : 'ghost'} 
              className="justify-start" 
              onClick={() => setPresetDate("lastMonth")}
            >
              Last Month
            </Button>
            <Separator />
            <Button 
              variant={selectedTimeframe === 'currentWeek' ? 'default' : 'ghost'} 
              className="justify-start" 
              onClick={() => setPresetDate("currentWeek")}
            >
              This Week
            </Button>
            <Button 
              variant={selectedTimeframe === 'lastWeek' ? 'default' : 'ghost'} 
              className="justify-start" 
              onClick={() => setPresetDate("lastWeek")}
            >
              Last Week
            </Button>
            <Separator />
            <Button 
              variant={selectedTimeframe === 'thisYear' ? 'default' : 'ghost'} 
              className="justify-start" 
              onClick={() => setPresetDate("thisYear")}
            >
              This Year
            </Button>
            <Button 
              variant={selectedTimeframe === 'lastYear' ? 'default' : 'ghost'} 
              className="justify-start" 
              onClick={() => setPresetDate("lastYear")}
            >
              Last Year
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Export */}
      <Button variant="outline" size="icon">
        <Download className="h-4 w-4" />
        <span className="sr-only">Download CSV</span>
      </Button>
    </div>
  );
}
