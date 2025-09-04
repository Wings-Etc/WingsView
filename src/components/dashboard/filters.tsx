"use client";

import * as React from "react";
import { DateRange } from "react-day-picker";
import { addDays, format, startOfYear, endOfYear, subYears } from "date-fns";
import { Calendar as CalendarIcon, Download } from "lucide-react";

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

interface FiltersProps extends React.HTMLAttributes<HTMLDivElement> {
  storeInfo: StoreInfo[];
}

export function Filters({ className, storeInfo }: FiltersProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  const districts = React.useMemo(() => [...new Set(storeInfo.map(s => s.District))], [storeInfo]);
  const [selectedDistrict, setSelectedDistrict] = React.useState<string | null>(null);
  const storesInDistrict = React.useMemo(() => 
    storeInfo.filter(s => s.District === selectedDistrict), 
    [storeInfo, selectedDistrict]
  );
  
  const setPresetDate = (preset: 'last7' | 'last30' | 'thisYear' | 'lastYear') => {
    const today = new Date();
    let from: Date;
    let to: Date = today;

    switch(preset) {
        case 'last7':
            from = addDays(today, -7);
            break;
        case 'last30':
            from = addDays(today, -30);
            break;
        case 'thisYear':
            from = startOfYear(today);
            break;
        case 'lastYear':
            from = startOfYear(subYears(today, 1));
            to = endOfYear(subYears(today, 1));
            break;
    }
    setDate({ from, to });
    setPopoverOpen(false);
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
       <Select onValueChange={setSelectedDistrict}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All Districts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Districts</SelectItem>
          {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select disabled={!selectedDistrict || storesInDistrict.length === 0}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Stores" />
        </SelectTrigger>
        <SelectContent>
           <SelectItem value="all">All Stores</SelectItem>
          {storesInDistrict.map(s => <SelectItem key={s.StoreNbr} value={s.StoreNbr}>#{s.StoreNbr}</SelectItem>)}
        </SelectContent>
      </Select>

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
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
            onSelect={setDate}
            numberOfMonths={2}
          />
           <div className="flex flex-col border-l p-2 space-y-2">
            <Button variant="ghost" className="justify-start" onClick={() => setPresetDate('last7')}>Last 7 Days</Button>
            <Button variant="ghost" className="justify-start" onClick={() => setPresetDate('last30')}>Last 30 Days</Button>
            <Separator />
            <Button variant="ghost" className="justify-start" onClick={() => setPresetDate('thisYear')}>This Year</Button>
            <Button variant="ghost" className="justify-start" onClick={() => setPresetDate('lastYear')}>Last Year</Button>
          </div>
        </PopoverContent>
      </Popover>
      <div className="flex items-center space-x-2">
        <Switch id="compare-ly" />
        <Label htmlFor="compare-ly">Vs. LY</Label>
      </div>
      <Button variant="outline" size="icon">
        <Download className="h-4 w-4"/>
        <span className="sr-only">Download CSV</span>
      </Button>
    </div>
  );
}