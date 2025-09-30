import React, { useState, useMemo } from "react";
import type { WeeklySnapshot } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { ChevronUp, ChevronDown } from "lucide-react";

interface WeeklySnapshotTableProps {
  snapshots: WeeklySnapshot[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(value || 0);

const formatPercent = (value: number) => `${((value || 0) * 100).toFixed(1)}%`;

const safeNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
};

type SortField = 'store' | 'weekEnding' | 'sales' | 'covers' | 'foodSales' | 'beerSales' | 'liquorSales' | 
  'foodCostPercent' | 'beerCostPercent' | 'liquorCostPercent' | 'alcoholCostPercent' | 'laborCost' | 
  'laborPercent' | 'revenuePerLaborHour' | 'flpdaPercent';

type SortDirection = 'asc' | 'desc';

export function WeeklySnapshotTable({ snapshots }: WeeklySnapshotTableProps) {
  const [sortField, setSortField] = useState<SortField>('store');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Get unique week ending dates from the snapshots
  const weekOptions = useMemo(() => {
    if (!snapshots || snapshots.length === 0) {
      return [];
    }
    
    const weeks = new Set<string>();
    snapshots.forEach((snapshot, index) => {
      // Try different date field names that might exist
      const endDate = snapshot.period_end || snapshot.end_date || snapshot.week_end || snapshot.Date || snapshot.date;

      if (endDate) {
        weeks.add(endDate);
      }
    });
    
    
    const sortedWeeks = Array.from(weeks)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Most recent first
      .map(week => ({
        value: week,
        label: format(parseISO(week), 'MMM dd, yyyy') + ' (Week Ending)'
      }));
      
    return sortedWeeks;
  }, [snapshots]);

  // Default to the most recent week (or last week if no data)
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    // Default to last Sunday if no data initially
    const lastSunday = new Date();
    lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());
    return format(lastSunday, 'yyyy-MM-dd');
  });

  // Update selected week when options change
  React.useEffect(() => {
    if (weekOptions.length > 0) {
      // Always set to the first (most recent) available week
      setSelectedWeek(weekOptions[0].value);
    }
  }, [weekOptions]);

  // Filter and sort snapshots by selected week
  const filteredSnapshots = useMemo(() => {
    if (!selectedWeek || !snapshots) return [];
    
    const filtered = snapshots.filter(snapshot => {
      const endDate = snapshot.period_end || snapshot.end_date || snapshot.week_end || snapshot.Date;
      return endDate === selectedWeek;
    });

    // Sort the filtered data
    return filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'store':
          const aStore = String(a.StoreNbr || a.store_nbr || a.ID || '');
          const bStore = String(b.StoreNbr || b.store_nbr || b.ID || '');
          // Extract numeric part for natural sorting (we1, we2, we10, etc.)
          const aNum = parseInt(aStore.replace(/[^\d]/g, '')) || 0;
          const bNum = parseInt(bStore.replace(/[^\d]/g, '')) || 0;
          aValue = aNum;
          bValue = bNum;
          break;
        case 'weekEnding':
          aValue = a.period_end || a.end_date || a.week_end || a.Date || '';
          bValue = b.period_end || b.end_date || b.week_end || b.Date || '';
          break;
        case 'sales':
          aValue = safeNumber(a.SalesSubtotal || a.sales_subtotal || a.SalesSubTotal);
          bValue = safeNumber(b.SalesSubtotal || b.sales_subtotal || b.SalesSubTotal);
          break;
        case 'covers':
          aValue = safeNumber(a.covers);
          bValue = safeNumber(b.covers);
          break;
        case 'foodSales':
          aValue = safeNumber(a.FoodSales || a.food_sales);
          bValue = safeNumber(b.FoodSales || b.food_sales);
          break;
        case 'beerSales':
          aValue = safeNumber(a.BeerSales || a.beer_sales);
          bValue = safeNumber(b.BeerSales || b.beer_sales);
          break;
        case 'liquorSales':
          aValue = safeNumber(a.LiquorSales || a.liquor_sales);
          bValue = safeNumber(b.LiquorSales || b.liquor_sales);
          break;
        case 'foodCostPercent':
          aValue = safeNumber(a.FoodCostPercent || a.food_cost_percent);
          bValue = safeNumber(b.FoodCostPercent || b.food_cost_percent);
          break;
        case 'beerCostPercent':
          aValue = safeNumber(a.BeerCostPercent || a.beer_cost_percent);
          bValue = safeNumber(b.BeerCostPercent || b.beer_cost_percent);
          break;
        case 'liquorCostPercent':
          aValue = safeNumber(a.LiquorCostPercent || a.liquor_cost_percent);
          bValue = safeNumber(b.LiquorCostPercent || b.liquor_cost_percent);
          break;
        case 'alcoholCostPercent':
          aValue = safeNumber(a.AlcoholCostPercent || a.alcohol_cost_percent);
          bValue = safeNumber(b.AlcoholCostPercent || b.alcohol_cost_percent);
          break;
        case 'laborCost':
          aValue = safeNumber(a.total_labor_cost || a.TotalLaborCost);
          bValue = safeNumber(b.total_labor_cost || b.TotalLaborCost);
          break;
        case 'laborPercent':
          const aSales = safeNumber(a.SalesSubtotal || a.sales_subtotal || a.SalesSubTotal);
          const aLaborCost = safeNumber(a.total_labor_cost || a.TotalLaborCost);
          aValue = aSales > 0 ? aLaborCost / aSales : 0;
          const bSales = safeNumber(b.SalesSubtotal || b.sales_subtotal || b.SalesSubTotal);
          const bLaborCost = safeNumber(b.total_labor_cost || b.TotalLaborCost);
          bValue = bSales > 0 ? bLaborCost / bSales : 0;
          break;
        case 'revenuePerLaborHour':
          aValue = safeNumber(a.revenue_per_labor_hr || a.RevenuePerLaborHr);
          bValue = safeNumber(b.revenue_per_labor_hr || b.RevenuePerLaborHr);
          break;
        case 'flpdaPercent':
          aValue = safeNumber(a.total_flpda_pct || a.TotalFlpdaPct);
          bValue = safeNumber(b.total_flpda_pct || b.TotalFlpdaPct);
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      // Handle string vs number comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        const comparison = Number(aValue) - Number(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
    });
  }, [snapshots, selectedWeek, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortableHeader = ({ field, children, className }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-semibold hover:bg-muted/100 hover:text-foreground"
        onClick={() => handleSort(field)}
      >
        <span className="flex items-center gap-1">
          {children}
          {sortField === field && (
            sortDirection === 'asc' ? 
              <ChevronUp className="h-3 w-3" /> : 
              <ChevronDown className="h-3 w-3" />
          )}
        </span>
      </Button>
    </TableHead>
  );


  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="rounded-md border p-4">
        <p className="text-muted-foreground text-center">
          No weekly snapshot data available. This could be because:
        </p>
        <ul className="text-muted-foreground text-sm mt-2 space-y-1">
          <li>• Weekly snapshots are processed on Monday for the previous week</li>
          <li>• Data may not be available for the requested date range</li>
          <li>• Try refreshing data or selecting a different time period</li>
        </ul>
        <div className="text-center mt-4">
          <p className="text-xs text-muted-foreground">
            Expected: Previous week's data with dropdown for week selection
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week Selector */}
      {weekOptions.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Week Ending:</label>
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select week ending date" />
            </SelectTrigger>
            <SelectContent>
              {weekOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader field="store">Store #</SortableHeader>
              <SortableHeader field="weekEnding">Week Ending</SortableHeader>
              <SortableHeader field="sales" className="text-right">Sales</SortableHeader>
              <SortableHeader field="covers" className="text-right">Covers</SortableHeader>
              <SortableHeader field="foodSales" className="text-right">Food Sales</SortableHeader>
              <SortableHeader field="beerSales" className="text-right">Beer Sales</SortableHeader>
              <SortableHeader field="liquorSales" className="text-right">Liquor Sales</SortableHeader>
              <SortableHeader field="foodCostPercent" className="text-right">Food Cost %</SortableHeader>
              <SortableHeader field="beerCostPercent" className="text-right">Beer Cost %</SortableHeader>
              <SortableHeader field="liquorCostPercent" className="text-right">Liquor Cost %</SortableHeader>
              <SortableHeader field="alcoholCostPercent" className="text-right">Alcohol Cost %</SortableHeader>
              <SortableHeader field="laborCost" className="text-right">Labor Cost</SortableHeader>
              <SortableHeader field="laborPercent" className="text-right">Labor %</SortableHeader>
              <SortableHeader field="revenuePerLaborHour" className="text-right">Rev/Labor Hr</SortableHeader>
              <SortableHeader field="flpdaPercent" className="text-right">FLPDA %</SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSnapshots.length > 0 ? (
              filteredSnapshots.map((s, index) => {
                const storeNbr = s.StoreNbr || s.store_nbr || s.ID || `store-${index}`;
                const endDate = s.period_end || s.end_date || s.week_end || s.Date || '';
                const sales = safeNumber(s.SalesSubtotal || s.sales_subtotal || s.SalesSubTotal);
                const laborCost = safeNumber(s.total_labor_cost || s.TotalLaborCost);
                const laborPercent = sales > 0 ? laborCost / sales : 0;

                return (
                  <TableRow key={`${storeNbr}-${endDate}-${index}`}>
                    <TableCell className="font-medium">{storeNbr}</TableCell>
                    <TableCell className="font-medium">
                      {endDate ? format(parseISO(endDate), 'MMM dd') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(sales)}
                    </TableCell>
                    <TableCell className="text-right">{safeNumber(s.covers)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(safeNumber(s.FoodSales || s.food_sales))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(safeNumber(s.BeerSales || s.beer_sales))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(safeNumber(s.LiquorSales || s.liquor_sales))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(safeNumber(s.FoodCostPercent || s.food_cost_percent))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(safeNumber(s.BeerCostPercent || s.beer_cost_percent))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(safeNumber(s.LiquorCostPercent || s.liquor_cost_percent))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(safeNumber(s.AlcoholCostPercent || s.alcohol_cost_percent))}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(laborCost)}</TableCell>
                    <TableCell className="text-right">
                      {formatPercent(laborPercent)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(safeNumber(s.revenue_per_labor_hr || s.RevenuePerLaborHr))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(safeNumber(s.total_flpda_pct || s.TotalFlpdaPct))}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={15} className="text-center text-muted-foreground py-8">
                  No data available for the selected week
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
