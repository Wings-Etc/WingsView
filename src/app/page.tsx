"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { DateRange } from "react-day-picker";
import { getStoreInfo, getSnapshots, getPerformance } from '@/lib/api';
import {
  getFiscalYTD,
  formatDateForAPI,
  getCurrentWeek,
  getLastWeek,
  getFiscalMonthToDate,
  getLastYearFiscalMonthToDate,
} from '@/lib/fiscal-dates';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DashboardHeader } from '@/components/dashboard/header';
import { KpiCard } from '@/components/dashboard/kpi-card';
import DualKpiCard from '@/components/dashboard/dual-kpi-card';
import { SalesTrendChart } from '@/components/dashboard/sales-trend-chart';
import { WeeklySnapshotTable } from '@/components/dashboard/weekly-snapshot-table';
import { TopBottomTable } from '@/components/dashboard/top-bottom-table';
import { StoreHeatmap } from '@/components/dashboard/store-heatmap';
import { CostBarsChart } from '@/components/dashboard/cost-bars-chart';
import {
  calculateAvgCheck,
  calculateCarryoutPercent,
  calculateDiscountsPercent,
  calculateGrossSales,
  calculateGuestCount,
  calculateLaborPercent,
  calculateNetSales,
  calculateCompSalesByStore,
  calculateGrossSalesByStore,
  calculateTableTurnTime,
  toNumber,
} from '@/lib/mappers';
import { LaborChart } from '@/components/dashboard/labor-chart';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { StoreInfo, DailyPerformance, WeeklySnapshot } from '@/types';

function normalizeStores(data: unknown): StoreInfo[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as StoreInfo[];
  if (typeof data === 'object') return Object.values(data as Record<string, StoreInfo>);
  return [];
}

export default function DashboardPage() {
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [performanceDataLY, setPerformanceDataLY] = useState<any[]>([]);
  const [performanceDataLW, setPerformanceDataLW] = useState<any[]>([]);
  const [allStoresPerformanceData, setAllStoresPerformanceData] = useState<any[]>([]); // For charts - always all stores
  const [allStoresPerformanceDataLY, setAllStoresPerformanceDataLY] = useState<any[]>([]); // For charts - always all stores
  const [weeklySnapshots, setWeeklySnapshots] = useState<any[]>([]);
  const [historicalSnapshots, setHistoricalSnapshots] = useState<any[]>([]); // For weekly snapshot table only
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [yearlyChartsLoading, setYearlyChartsLoading] = useState(true);
  const [hasHistoricalData, setHasHistoricalData] = useState(false);
  const [isCurrentWeekSelected, setIsCurrentWeekSelected] = useState(true);
  const [hasInitialDataLoaded, setHasInitialDataLoaded] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('monthToDate');
  const [lyStartDate, setLyStartDate] = useState<Date | null>(null);
  const [lyEndDate, setLyEndDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const fiscalMTD = getFiscalMonthToDate();
    return {
      from: fiscalMTD.start,
      to: fiscalMTD.end,
    };
  });

  // State for sales trend chart year selection
  const [enabledYears, setEnabledYears] = useState({
    currentYear: true,
    lastYear: true,
    twoYearsAgo: false,
    threeYearsAgo: false,
    fourYearsAgo: false,
  });

  // Track which years have been loaded to avoid duplicate API calls
  const [loadedYears, setLoadedYears] = useState<Set<number>>(new Set());

  // Calculate required years back for data loading
  const getRequiredYearsBack = useCallback(() => {
    let maxYearsBack = 2; // Default: current year and last year
    if (enabledYears.twoYearsAgo) maxYearsBack = Math.max(maxYearsBack, 3);
    if (enabledYears.threeYearsAgo) maxYearsBack = Math.max(maxYearsBack, 4);
    if (enabledYears.fourYearsAgo) maxYearsBack = Math.max(maxYearsBack, 5);
    return maxYearsBack;
  }, [enabledYears]);

  // Helper function to convert snapshots to performance format for KPI compatibility
  const convertSnapshotsToPerformance = (snapshots: any[]): any[] => {
    console.log('🔄 Converting snapshots to performance format:', {
      count: snapshots.length,
      sampleSnapshot: snapshots[0]
    });
    
    return snapshots.map(snapshot => ({
      StoreNbr: snapshot.StoreNbr,
      Date: snapshot.period_end,
      SalesSubTotal: snapshot.SalesSubtotal || 0,
      BeerSales: snapshot.BeerSales || 0,
      LiquorSales: snapshot.LiquorSales || 0,
      FoodSales: snapshot.FoodSales || 0,
      Covers: snapshot.covers || 0,
      // Calculate Discounts from DiscountCostPercent if available
      Discounts: snapshot.DiscountCostPercent ? 
        (snapshot.SalesSubtotal * snapshot.DiscountCostPercent) : 0,
      // Map labor fields - try multiple possible field names
      total_labor_dollars: snapshot.total_labor_cost || snapshot.total_labor_dollars || 0,
      total_labor_cost: snapshot.total_labor_cost || snapshot.total_labor_dollars || 0,
      total_labor_hours: snapshot.labor_hours || snapshot.total_labor_hours || 0,
      // Now available in snapshots
      ToGo: snapshot.ToGo || 0, // ✅ NOW AVAILABLE in snapshots
      FoundationDonations: snapshot.FoundationDonations || 0, // ✅ NOW AVAILABLE in snapshots
      // Still not available in snapshots
      Entrees: 0, // NOT AVAILABLE in snapshots
      WebTotal: 0, // NOT AVAILABLE in snapshots
      // Pass through snapshot-specific fields
      ...snapshot
    }));
  };

  // Helper function to check if date range is a complete Monday-Sunday week
  const isCompleteWeek = (startDate: Date, endDate: Date): boolean => {
    // Check if start is Monday (getDay() = 1) and end is Sunday (getDay() = 0)
    const isStartMonday = startDate.getDay() === 1;
    const isEndSunday = endDate.getDay() === 0;
    
    // Check if it's exactly 6 days apart (Monday to Sunday)
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const isExactWeek = daysDiff === 6;
        
    return isStartMonday && isEndSunday && isExactWeek;
  };

  // Helper function to check if a date range includes the current incomplete week
  const dateRangeIncludesCurrentWeek = (startDate: Date, endDate: Date): boolean => {
    const currentWeek = getCurrentWeek();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    // Check if the current week is incomplete (today is not Sunday or beyond the week end)
    const isCurrentWeekIncomplete = today < currentWeek.end;
    
    // Check if the date range overlaps with current incomplete week
    const overlapsCurrentWeek = (startDate <= currentWeek.end) && (endDate >= currentWeek.start);
    
    return isCurrentWeekIncomplete && overlapsCurrentWeek;
  };

  // Get normalized store info for use in filtering
  const allStores: StoreInfo[] = normalizeStores(storeInfo);

  // Function to process weekly snapshots into Sales Trend chart data (always full year by month)
  const processSalesTrendData = useCallback((storeFilter?: string, districtFilter?: string) => {
    if (!weeklySnapshots || weeklySnapshots.length === 0) return [];

    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    const twoYearsAgo = currentYear - 2;
    const threeYearsAgo = currentYear - 3;
    const fourYearsAgo = currentYear - 4;
    
    // Group snapshots by month and year
    const monthlyData = new Map<string, { ty: number, ly: number, ly2: number, ly3: number, ly4: number }>();
    
    // Initialize all 12 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach(month => {
      monthlyData.set(month, { ty: 0, ly: 0, ly2: 0, ly3: 0, ly4: 0 });
    });

    // Filter snapshots by store/district if specified
    const filteredSnapshots = weeklySnapshots.filter(snapshot => {
      if (!snapshot.SalesSubtotal || !snapshot.period_end) return false;
      
      // Apply store filter
      if (storeFilter && storeFilter !== 'all') {
        const cleanStoreFilter = storeFilter.replace(/^we/i, '');
        const cleanSnapshotStore = String(snapshot.StoreNbr || '').replace(/^we/i, '');
        if (cleanSnapshotStore !== cleanStoreFilter) return false;
      }
      
      // Apply district filter
      if (districtFilter && districtFilter !== 'all') {
        // Find store info for this snapshot to check district
        const storeInfo = allStores.find(s => {
          const cleanStoreNbr = String(s.StoreNbr || '').replace(/^we/i, '');
          const cleanSnapshotStore = String(snapshot.StoreNbr || '').replace(/^we/i, '');
          return cleanStoreNbr === cleanSnapshotStore;
        });
        if (!storeInfo || storeInfo.District !== districtFilter) return false;
      }
      
      return true;
    });

    // Debug: Log year processing
    const yearCounts = new Map<number, number>();
    
    filteredSnapshots.forEach(snapshot => {
      const snapshotDate = new Date(snapshot.period_end);
      const year = snapshotDate.getFullYear();
      const monthName = snapshotDate.toLocaleDateString('en-US', { month: 'short' });
      
      // Count records per year for debugging
      yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
      
      const existing = monthlyData.get(monthName) || { ty: 0, ly: 0, ly2: 0, ly3: 0, ly4: 0 };
      
      if (year === currentYear) {
        // This year data
        monthlyData.set(monthName, { 
          ...existing,
          ty: existing.ty + (snapshot.SalesSubtotal || 0)
        });
      } else if (year === lastYear) {
        // Last year data
        monthlyData.set(monthName, { 
          ...existing,
          ly: existing.ly + (snapshot.SalesSubtotal || 0)
        });
      } else if (year === twoYearsAgo) {
        // Two years ago data
        monthlyData.set(monthName, { 
          ...existing,
          ly2: existing.ly2 + (snapshot.SalesSubtotal || 0)
        });
      } else if (year === threeYearsAgo) {
        // Three years ago data
        monthlyData.set(monthName, { 
          ...existing,
          ly3: existing.ly3 + (snapshot.SalesSubtotal || 0)
        });
      } else if (year === fourYearsAgo) {
        // Four years ago data
        monthlyData.set(monthName, { 
          ...existing,
          ly4: existing.ly4 + (snapshot.SalesSubtotal || 0)
        });
      }
    });

    // Debug logging
    console.log('📊 Sales Trend Data Processing:', {
      totalSnapshots: filteredSnapshots.length,
      yearBreakdown: Object.fromEntries(yearCounts),
      targetYears: { currentYear, lastYear, twoYearsAgo, threeYearsAgo, fourYearsAgo },
      enabledYears
    });

    // Convert to chart format with dynamic year labels
    return {
      data: months.map(month => {
        const monthData = monthlyData.get(month) || { ty: 0, ly: 0, ly2: 0, ly3: 0, ly4: 0 };
        return {
          period: month,
          ty: monthData.ty,
          ly: monthData.ly,
          ...(enabledYears.twoYearsAgo && { ly2: monthData.ly2 }),
          ...(enabledYears.threeYearsAgo && { ly3: monthData.ly3 }),
          ...(enabledYears.fourYearsAgo && { ly4: monthData.ly4 }),
        };
      }),      
      yearLabels: {
        currentYear: currentYear.toString(),
        lastYear: lastYear.toString(),
        twoYearsAgo: twoYearsAgo.toString(),
        threeYearsAgo: threeYearsAgo.toString(),
        fourYearsAgo: fourYearsAgo.toString()
      }
    };
  }, [weeklySnapshots, storeInfo, enabledYears]);

  // Function to process weekly snapshots into Labor chart data (states grouped by months)
  const processLaborData = useCallback((storeFilter?: string, districtFilter?: string) => {
    if (!weeklySnapshots || weeklySnapshots.length === 0) return [];

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-based (0=Jan, 11=Dec)
    
    // Group snapshots by state and month for current year (YTD only)
    const stateMonthData = new Map<string, Map<string, { sales: number, labor: number }>>();
    
    // Get months from Jan to current month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const ytdMonths = months.slice(0, currentMonth + 1);

    // Filter snapshots by store/district if specified
    const filteredSnapshots = weeklySnapshots.filter(snapshot => {
      if (!snapshot.total_labor_cost || !snapshot.SalesSubtotal || !snapshot.period_end) return false;
      
      // Apply store filter
      if (storeFilter && storeFilter !== 'all') {
        const cleanStoreFilter = storeFilter.replace(/^we/i, '');
        const cleanSnapshotStore = String(snapshot.StoreNbr || '').replace(/^we/i, '');
        if (cleanSnapshotStore !== cleanStoreFilter) return false;
      }
      
      // Apply district filter
      if (districtFilter && districtFilter !== 'all') {
        // Find store info for this snapshot to check district
        const storeInfo = allStores.find(s => {
          const cleanStoreNbr = String(s.StoreNbr || '').replace(/^we/i, '');
          const cleanSnapshotStore = String(snapshot.StoreNbr || '').replace(/^we/i, '');
          return cleanStoreNbr === cleanSnapshotStore;
        });
        if (!storeInfo || storeInfo.District !== districtFilter) return false;
      }
      
      return true;
    });

    filteredSnapshots.forEach(snapshot => {
      const snapshotDate = new Date(snapshot.period_end);
      const year = snapshotDate.getFullYear();
      const month = snapshotDate.getMonth();
      
      // Only include current year data and only up to current month (YTD)
      if (year === currentYear && month <= currentMonth) {
        // Find store info for this snapshot to get state
        const storeInfo = allStores.find(s => {
          const cleanStoreNbr = String(s.StoreNbr || '').replace(/^we/i, '');
          const cleanSnapshotStore = String(snapshot.StoreNbr || '').replace(/^we/i, '');
          return cleanStoreNbr === cleanSnapshotStore;
        });
        
        if (storeInfo && storeInfo.State) {
          const monthName = snapshotDate.toLocaleDateString('en-US', { month: 'short' });
          
          // Get or create state data map
          let stateMonths = stateMonthData.get(storeInfo.State);
          if (!stateMonths) {
            stateMonths = new Map();
            stateMonthData.set(storeInfo.State, stateMonths);
          }
          
          const existing = stateMonths.get(monthName) || { sales: 0, labor: 0 };
          
          stateMonths.set(monthName, {
            sales: existing.sales + (snapshot.SalesSubtotal || 0),
            labor: existing.labor + (snapshot.total_labor_cost || 0)
          });
        }
      }
    });

    // Convert to chart format: each state becomes a row with month columns
    const states = Array.from(stateMonthData.keys()).sort();
    
    return states.map(state => {
      const stateMonths = stateMonthData.get(state) || new Map();
      const result: any = { state };
      
      ytdMonths.forEach(month => {
        const monthData = stateMonths.get(month);
        if (monthData && monthData.sales > 0) {
          result[month] = Number(((monthData.labor / monthData.sales) * 100).toFixed(1));
        } else {
          result[month] = 0;
        }
      });
      
      return result;
    });
  }, [weeklySnapshots, allStores]);

  // Function to process weekly snapshots into Cost chart data (YTD only)
  const processCostData = useCallback((storeFilter?: string, districtFilter?: string) => {
    if (!weeklySnapshots || weeklySnapshots.length === 0) return [];

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-based (0=Jan, 11=Dec)
    
    // Group snapshots by month for current year only (YTD)
    const monthlyData = new Map<string, { 
      totalSales: number,
      totalFoodCost: number, 
      totalBeerCost: number, 
      totalLiquorCost: number
    }>();
    
    // Initialize months from Jan to current month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const ytdMonths = months.slice(0, currentMonth + 1); // Only up to current month
    
    ytdMonths.forEach(month => {
      monthlyData.set(month, { totalSales: 0, totalFoodCost: 0, totalBeerCost: 0, totalLiquorCost: 0 });
    });

    // Filter snapshots by store/district if specified
    const filteredSnapshots = weeklySnapshots.filter(snapshot => {
      if (!snapshot.period_end || !snapshot.SalesSubtotal) return false;
      
      // Apply store filter
      if (storeFilter && storeFilter !== 'all') {
        const cleanStoreFilter = storeFilter.replace(/^we/i, '');
        const cleanSnapshotStore = String(snapshot.StoreNbr || '').replace(/^we/i, '');
        if (cleanSnapshotStore !== cleanStoreFilter) return false;
      }
      
      // Apply district filter
      if (districtFilter && districtFilter !== 'all') {
        // Find store info for this snapshot to check district
        const storeInfo = allStores.find(s => {
          const cleanStoreNbr = String(s.StoreNbr || '').replace(/^we/i, '');
          const cleanSnapshotStore = String(snapshot.StoreNbr || '').replace(/^we/i, '');
          return cleanStoreNbr === cleanSnapshotStore;
        });
        if (!storeInfo || storeInfo.District !== districtFilter) return false;
      }
      
      return true;
    });

    filteredSnapshots.forEach(snapshot => {
      const snapshotDate = new Date(snapshot.period_end);
      const year = snapshotDate.getFullYear();
      const month = snapshotDate.getMonth();
      
      // Only include current year data and only up to current month (YTD)
      if (year === currentYear && month <= currentMonth) {
        const monthName = snapshotDate.toLocaleDateString('en-US', { month: 'short' });
        const existing = monthlyData.get(monthName);
        
        if (existing) {
          // Cost percentages are stored as decimals (0.225 for 22.5%), so use them directly
          const sales = snapshot.SalesSubtotal || 0;
          const foodCost = sales * (snapshot.FoodCostPercent || 0);
          const beerCost = sales * (snapshot.BeerCostPercent || 0);
          const liquorCost = sales * (snapshot.LiquorCostPercent || 0);
          
          monthlyData.set(monthName, {
            totalSales: existing.totalSales + sales,
            totalFoodCost: existing.totalFoodCost + foodCost,
            totalBeerCost: existing.totalBeerCost + beerCost,
            totalLiquorCost: existing.totalLiquorCost + liquorCost
          });
        }
      }
    });

    // Convert to chart format with cost as percentage of sales
    return ytdMonths.map(month => {
      const data = monthlyData.get(month);
      if (!data || data.totalSales === 0) {
        return {
          period: month,
          food: 0,
          beer: 0,
          liquor: 0
        };
      }

      // Calculate cost as percentage of sales (multiply by 100 since stored as decimals)
      return {
        period: month,
        food: Number((data.totalFoodCost / data.totalSales * 100).toFixed(1)),
        beer: Number((data.totalBeerCost / data.totalSales * 100).toFixed(1)),
        liquor: Number((data.totalLiquorCost / data.totalSales * 100).toFixed(1))
      };
    });
  }, [weeklySnapshots, storeInfo]);

  // Get processed chart data (filtered by selected store/district)
  const salesTrendResult = processSalesTrendData(selectedStore, selectedDistrict);
  const salesTrendData = salesTrendResult?.data || [];
  const yearLabels = salesTrendResult?.yearLabels;
  const laborChartData = processLaborData(selectedStore, selectedDistrict);
  const costChartData = processCostData(selectedStore, selectedDistrict);

  // Charts should show loading when data is being refreshed OR when we don't have historical data
  const showChartsLoading = chartsLoading || refreshing || !hasHistoricalData;
  
  // Yearly charts (Sales Trend, Labor, Cost) should only show loading when yearly data is being loaded
  const showYearlyChartsLoading = yearlyChartsLoading || !hasHistoricalData;

  // Function to filter existing historical data when date range changes
  const updateDataForDateRange = useCallback(async () => {
    console.log('🔄 updateDataForDateRange called with dateRange:', {
      from: dateRange?.from?.toDateString(),
      to: dateRange?.to?.toDateString(),
      hasHistoricalData: weeklySnapshots.length > 0,
      selectedStore,
      selectedDistrict
    });
    
    if (!dateRange?.from || !dateRange?.to) {
      console.log('❌ No date range provided, exiting');
      return;
    }

    // Check if current week is selected
    const currentWeek = getCurrentWeek();
    const isCurrentWeek = dateRange.from.getTime() === currentWeek.start.getTime() && 
                         dateRange.to.getTime() === currentWeek.end.getTime();
    setIsCurrentWeekSelected(isCurrentWeek);
    console.log('📅 Is current week selected:', isCurrentWeek);

    // First, try to use existing data for quick filtering (no loading states needed)
    if (weeklySnapshots.length > 0 && !isCurrentWeek) {
      console.log('⚡ Attempting to use existing snapshot data for fast filtering');
      
      // Filter snapshots by date range
      const filteredSnapshots = weeklySnapshots.filter(s => {
        if (!s.period_end) return false;
        const snapshotDate = new Date(s.period_end);
        return snapshotDate >= dateRange.from && snapshotDate <= dateRange.to;
      });
      
      // Apply store filters if any
      let targetSnapshots = filteredSnapshots;
      if (selectedStore && selectedStore !== 'all') {
        const cleanStoreFilter = selectedStore.replace(/^we/i, '');
        targetSnapshots = filteredSnapshots.filter(snapshot => {
          const cleanSnapshotStore = String(snapshot.StoreNbr || '').replace(/^we/i, '');
          return cleanSnapshotStore === cleanStoreFilter;
        });
      } else if (selectedDistrict && selectedDistrict !== 'all') {
        const stores: StoreInfo[] = normalizeStores(storeInfo);
        const districtStores = stores.filter(s => s.District === selectedDistrict);
        const districtStoreNbrs = districtStores.map(s => s.StoreNbr.replace(/^we/i, ''));
        
        targetSnapshots = filteredSnapshots.filter(snapshot => {
          const cleanSnapshotStore = String(snapshot.StoreNbr || '').replace(/^we/i, '');
          return districtStoreNbrs.includes(cleanSnapshotStore);
        });
      }
      
      if (targetSnapshots.length > 0) {
        console.log(`✅ Using ${targetSnapshots.length} existing snapshots for fast update (no API call needed)`);
        const currentData = convertSnapshotsToPerformance(targetSnapshots);
        setPerformanceData(currentData);
        setAllStoresPerformanceData(currentData);
        
        // Handle comparison data (LY) using existing snapshots
        const lyStart = new Date(dateRange.from);
        lyStart.setFullYear(lyStart.getFullYear() - 1);
        const lyEnd = new Date(dateRange.to);
        lyEnd.setFullYear(lyEnd.getFullYear() - 1);
        
        const lySnapshots = weeklySnapshots.filter(s => {
          if (!s.period_end) return false;
          const snapshotDate = new Date(s.period_end);
          return snapshotDate >= lyStart && snapshotDate <= lyEnd;
        });
        
        // Apply same store filters to LY data
        let targetLYSnapshots = lySnapshots;
        if (selectedStore && selectedStore !== 'all') {
          const cleanStoreFilter = selectedStore.replace(/^we/i, '');
          targetLYSnapshots = lySnapshots.filter(snapshot => {
            const cleanSnapshotStore = String(snapshot.StoreNbr || '').replace(/^we/i, '');
            return cleanSnapshotStore === cleanStoreFilter;
          });
        } else if (selectedDistrict && selectedDistrict !== 'all') {
          const stores: StoreInfo[] = normalizeStores(storeInfo);
          const districtStores = stores.filter(s => s.District === selectedDistrict);
          const districtStoreNbrs = districtStores.map(s => s.StoreNbr.replace(/^we/i, ''));
          
          targetLYSnapshots = lySnapshots.filter(snapshot => {
            const cleanSnapshotStore = String(snapshot.StoreNbr || '').replace(/^we/i, '');
            return districtStoreNbrs.includes(cleanSnapshotStore);
          });
        }
        
        if (targetLYSnapshots.length > 0) {
          console.log(`✅ Using ${targetLYSnapshots.length} existing LY snapshots for comparison`);
          const lyData = convertSnapshotsToPerformance(targetLYSnapshots);
          setPerformanceDataLY(lyData);
          setAllStoresPerformanceDataLY(lyData);
        } else {
          console.log('⚠️ No LY snapshots found in cache, will need API call');
          // Set empty LY data for now, could enhance to make targeted API call if needed
          setPerformanceDataLY([]);
          setAllStoresPerformanceDataLY([]);
        }
        
        // Update state with calculated dates for UI purposes
        setLyStartDate(lyStart);
        setLyEndDate(lyEnd);
        
        console.log('⚡ Fast update completed using cached data only');
        // Make sure to clear any loading states
        setRefreshing(false);
        setChartsLoading(false);
        setLoading(false);
        return; // Exit early - no API calls needed!
      }
    }
    
    console.log('📡 Existing data insufficient, falling back to API calls');
    setRefreshing(true);
    // Note: Not setting chartsLoading here since yearly charts don't depend on date ranges

    try {
      // Determine which stores to filter by
      const storeFilters: string[] = [];
      if (selectedStore) {
        storeFilters.push(selectedStore);
      } else if (selectedDistrict) {
        // Get all stores in the selected district
        const stores: StoreInfo[] = normalizeStores(storeInfo);
        const districtStores = stores.filter(s => s.District === selectedDistrict);
        storeFilters.push(...districtStores.map(s => s.StoreNbr));
      }
      
      console.log('🏪 Store filters applied:', { selectedStore, selectedDistrict, storeFilters });

      // Determine if current period is a complete week
      const isCurrentWeekComplete = isCompleteWeek(dateRange.from, dateRange.to);

      // Calculate last year period using fiscal calendar when current selection is month-to-date
      let lyStart: Date;
      let lyEnd: Date;
      
      // Check if current selection matches fiscal month-to-date
      const currentFiscalMTD = getFiscalMonthToDate();
      const isCurrentlyMonthToDate = selectedTimeframe === 'monthToDate' || 
        (dateRange.from.getTime() === currentFiscalMTD.start.getTime() && 
         Math.abs(dateRange.to.getTime() - currentFiscalMTD.end.getTime()) < 24 * 60 * 60 * 1000); // Within 24 hours
      
      if (isCurrentlyMonthToDate) {
        console.log('📅 Using fiscal calendar for last year month-to-date comparison');
        const lastYearFiscalMTD = getLastYearFiscalMonthToDate();
        lyStart = lastYearFiscalMTD.start;
        lyEnd = lastYearFiscalMTD.end;
      } else {
        console.log('📅 Using standard calendar offset for last year comparison');
        const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
        lyStart = new Date(dateRange.from);
        lyStart.setFullYear(lyStart.getFullYear() - 1);
        lyEnd = new Date(lyStart);
        lyEnd.setDate(lyEnd.getDate() + daysDiff);
      }
      
      // Update state with calculated dates
      setLyStartDate(lyStart);
      setLyEndDate(lyEnd);
      
      const isLYWeekComplete = isCompleteWeek(lyStart, lyEnd);

      // === STEP 1: Load current period data ===
      
      let currentData;
      // Check if we can use existing historical data for complete weeks (with or without filters)
      if (isCurrentWeekComplete && !isCurrentWeek && weeklySnapshots.length > 0) {
        console.log('📊 Trying to use existing historical data for complete week');
        
        // Filter existing snapshots for the selected date range
        const targetWeekEnd = formatDateForAPI(dateRange.to);
        let existingSnapshots = weeklySnapshots.filter(s => s.period_end === targetWeekEnd);
        
        // If we have store filters, filter the snapshots by stores
        if (storeFilters.length > 0 && existingSnapshots.length > 0) {
          existingSnapshots = existingSnapshots.filter(snapshot => {
            const cleanSnapshotStore = String(snapshot.StoreNbr || '').replace(/^we/i, '');
            return storeFilters.some(filter => {
              const cleanFilter = filter.replace(/^we/i, '');
              return cleanSnapshotStore === cleanFilter;
            });
          });
        }
        
        if (existingSnapshots.length > 0) {
          console.log('✅ Found existing snapshot data, using it instead of API call');
          currentData = convertSnapshotsToPerformance(existingSnapshots);
        } else {
          console.log('📊 No existing snapshot found for complete week, making targeted API call');
          const snapshots = await getSnapshots(
            formatDateForAPI(dateRange.from),
            formatDateForAPI(dateRange.to),
            storeFilters
          );
          currentData = convertSnapshotsToPerformance(snapshots);
        }
      } else if (isCurrentWeek) {
        // Use performance endpoint for current week (day-matching)
        console.log('📊 Using performance endpoint for current week day-matching');
        currentData = await getPerformance(
          formatDateForAPI(dateRange.from),
          formatDateForAPI(dateRange.to),
          storeFilters
        );
      } else {
        // For incomplete weeks or when store filters are applied, avoid large date ranges that cause pagination issues
        const dateRangeDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dateRangeDays > 30 && storeFilters.length === 0) {
          console.log('⚠️  Large date range detected, using aggregated snapshot data to avoid pagination issues');
          // Use aggregated snapshot data for large date ranges (only when no store filter)
          const filteredSnapshots = weeklySnapshots.filter(s => {
            const snapshotDate = new Date(s.period_end);
            return snapshotDate >= dateRange.from && snapshotDate <= dateRange.to;
          });
          
          if (filteredSnapshots.length > 0) {
            console.log('✅ Using filtered snapshot data for large date range:', filteredSnapshots.length, 'weeks');
            currentData = convertSnapshotsToPerformance(filteredSnapshots);
          } else {
            console.log('❌ No snapshots available for large date range, showing empty data');
            currentData = [];
          }
        } else if (dateRangeDays <= 30 && dateRangeIncludesCurrentWeek(dateRange.from, dateRange.to) && storeFilters.length === 0) {
          console.log('📊 Medium date range includes current incomplete week, using hybrid approach');
          
          // For medium-sized ranges that include current incomplete week, use hybrid approach
          const currentWeek = getCurrentWeek();
          let snapshotData: DailyPerformance[] = [];
          let performanceData: DailyPerformance[] = [];
          
          // Load snapshots for complete weeks in the range
          const completeWeekEnd = new Date(currentWeek.start);
          completeWeekEnd.setDate(completeWeekEnd.getDate() - 1); // Day before current week starts
          
          if (completeWeekEnd >= dateRange.from) {
            const snapshots = await getSnapshots(
              formatDateForAPI(dateRange.from),
              formatDateForAPI(completeWeekEnd),
              storeFilters
            );
            snapshotData = convertSnapshotsToPerformance(snapshots);
          }
          
          // Load performance data for current incomplete week portion
          const currentWeekStart = new Date(Math.max(currentWeek.start.getTime(), dateRange.from.getTime()));
          const currentWeekEndInRange = new Date(Math.min(dateRange.to.getTime(), new Date().getTime()));
          
          if (currentWeekStart <= currentWeekEndInRange) {
            performanceData = await getPerformance(
              formatDateForAPI(currentWeekStart),
              formatDateForAPI(currentWeekEndInRange),
              storeFilters
            );
          }
          
          // Combine both datasets
          currentData = [...snapshotData, ...performanceData];
        } else {
          console.log('📊 Using performance endpoint for small date range or with store filters');
          currentData = await getPerformance(
            formatDateForAPI(dateRange.from),
            formatDateForAPI(dateRange.to),
            storeFilters
          );
        }
      }
      setPerformanceData(currentData);

      // === STEP 1.5: Load all-stores data for charts (if store filtering is applied) ===
      let allStoresCurrentData = currentData;
      if (storeFilters.length > 0) {
        // If a specific store is selected, load all stores data separately for charts
        if (isCurrentWeekComplete && !isCurrentWeek && weeklySnapshots.length > 0) {
          console.log('📊 Loading all-stores snapshot data for charts');
          const targetWeekEnd = formatDateForAPI(dateRange.to);
          const existingSnapshot = weeklySnapshots.find(s => s.period_end === targetWeekEnd);
          if (existingSnapshot) {
            allStoresCurrentData = convertSnapshotsToPerformance([existingSnapshot]);
          } else {
            const snapshots = await getSnapshots(
              formatDateForAPI(dateRange.from),
              formatDateForAPI(dateRange.to),
              [] // No store filter for charts
            );
            allStoresCurrentData = convertSnapshotsToPerformance(snapshots);
          }
        } else if (isCurrentWeek) {
          console.log('📊 Loading all-stores performance data for charts');
          allStoresCurrentData = await getPerformance(
            formatDateForAPI(dateRange.from),
            formatDateForAPI(dateRange.to),
            [] // No store filter for charts
          );
        } else {
          const dateRangeDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
          if (dateRangeDays > 30) {
            const filteredSnapshots = weeklySnapshots.filter(s => {
              const snapshotDate = new Date(s.period_end);
              return snapshotDate >= dateRange.from && snapshotDate <= dateRange.to;
            });
            allStoresCurrentData = filteredSnapshots.length > 0 ? convertSnapshotsToPerformance(filteredSnapshots) : [];
          } else {
            console.log('📊 Loading all-stores performance data for charts');
            allStoresCurrentData = await getPerformance(
              formatDateForAPI(dateRange.from),
              formatDateForAPI(dateRange.to),
              [] // No store filter for charts
            );
          }
        }
      }
      setAllStoresPerformanceData(allStoresCurrentData);

      // === STEP 2: Load comparison data (LY or LW) ===
      
      let comparisonData;
      if (isCurrentWeek) {
        // Load last week data with day-matching - this is always a small call
        const lastWeek = getLastWeek();
        const today = new Date();
        
        // Calculate how many days into the current week we are
        const currentWeekStart = getCurrentWeek().start;
        const daysIntoWeek = Math.floor((today.getTime() - currentWeekStart.getTime()) / (1000 * 60 * 60 * 24));
        
        // Create end date for last week comparison (same number of days as current week)
        const lastWeekComparisonEnd = new Date(lastWeek.start);
        lastWeekComparisonEnd.setDate(lastWeekComparisonEnd.getDate() + daysIntoWeek);
        
        console.log('📅 Loading last week data (matching days only):', {
          lastWeekStart: lastWeek.start.toDateString(),
          lastWeekComparisonEnd: lastWeekComparisonEnd.toDateString(),
          daysIntoWeek: daysIntoWeek + 1, // +1 because we include the current day
          todayIs: today.toDateString()
        });

        // Always use performance endpoint for day-matching comparison (small call)
        comparisonData = await getPerformance(
          formatDateForAPI(lastWeek.start),
          formatDateForAPI(lastWeekComparisonEnd),
          storeFilters
        );
        setPerformanceDataLW(comparisonData);
      } else {
        // Load last year data - prioritize cached snapshots
        if (isLYWeekComplete && weeklySnapshots.length > 0) {
          console.log('📊 Trying to use existing historical data for LY complete week');
          
          // Filter existing snapshots for the LY date range
          const targetLYWeekEnd = formatDateForAPI(lyEndDate);
          const existingLYSnapshot = weeklySnapshots.find(s => s.period_end === targetLYWeekEnd);
          
          if (existingLYSnapshot) {
            console.log('✅ Found existing LY snapshot data, using it instead of API call');
            // If store filters exist, we need to filter the snapshot by store
            if (storeFilters.length > 0) {
              console.log('🏪 Applying store filter to existing LY snapshot');
              const filteredSnapshot = { ...existingLYSnapshot };
              // For simplicity, use snapshot API for filtered LY data
              const lySnapshots = await getSnapshots(
                formatDateForAPI(lyStart),
                formatDateForAPI(lyEnd),
                storeFilters
              );
              comparisonData = convertSnapshotsToPerformance(lySnapshots);
            } else {
              comparisonData = convertSnapshotsToPerformance([existingLYSnapshot]);
            }
          } else {
            console.log('📊 No existing LY snapshot found, making targeted snapshot API call');
            const lySnapshots = await getSnapshots(
              formatDateForAPI(lyStart),
              formatDateForAPI(lyEnd),
              storeFilters
            );
            comparisonData = convertSnapshotsToPerformance(lySnapshots);
          }
        } else {
          // For large LY date ranges, use cached snapshots when possible
          const lyDateRangeDays = Math.ceil((lyEnd.getTime() - lyStart.getTime()) / (1000 * 60 * 60 * 24));
          
          if (lyDateRangeDays > 30 && weeklySnapshots.length > 0 && storeFilters.length === 0) {
            console.log('⚠️  Large LY date range detected, using filtered snapshot data to avoid pagination');
            const filteredLYSnapshots = weeklySnapshots.filter(s => {
              const snapshotDate = new Date(s.period_end);
              return snapshotDate >= lyStart && snapshotDate <= lyEnd;
            });
            
            if (filteredLYSnapshots.length > 0) {
              console.log('✅ Using filtered LY snapshot data:', filteredLYSnapshots.length, 'weeks');
              comparisonData = convertSnapshotsToPerformance(filteredLYSnapshots);
            } else {
              console.log('❌ No LY snapshots available, using empty comparison data');
              comparisonData = [];
            }
          } else {
            console.log('📊 Using performance endpoint for small LY date range or with store filters');
            comparisonData = await getPerformance(
              formatDateForAPI(lyStart),
              formatDateForAPI(lyEnd),
              storeFilters
            );
          }
        }
        setPerformanceDataLY(comparisonData);

        // === STEP 2.5: Load all-stores comparison data for charts (if store filtering is applied) ===
        let allStoresComparisonData = comparisonData;
        if (storeFilters.length > 0) {
          if (isLYWeekComplete && weeklySnapshots.length > 0) {
            console.log('📊 Loading all-stores LY snapshot data for charts');
            const targetLYWeekEnd = formatDateForAPI(lyEnd);
            const existingLYSnapshot = weeklySnapshots.find(s => s.period_end === targetLYWeekEnd);
            if (existingLYSnapshot) {
              allStoresComparisonData = convertSnapshotsToPerformance([existingLYSnapshot]);
            } else {
              const lySnapshots = await getSnapshots(
                formatDateForAPI(lyStart),
                formatDateForAPI(lyEnd),
                [] // No store filter for charts
              );
              allStoresComparisonData = convertSnapshotsToPerformance(lySnapshots);
            }
          } else {
            const lyDateRangeDays = Math.ceil((lyEnd.getTime() - lyStart.getTime()) / (1000 * 60 * 60 * 24));
            if (lyDateRangeDays > 30 && weeklySnapshots.length > 0) {
              const filteredLYSnapshots = weeklySnapshots.filter(s => {
                const snapshotDate = new Date(s.period_end);
                return snapshotDate >= lyStart && snapshotDate <= lyEnd;
              });
              allStoresComparisonData = filteredLYSnapshots.length > 0 ? convertSnapshotsToPerformance(filteredLYSnapshots) : [];
            } else {
              console.log('📊 Loading all-stores LY performance data for charts');
              allStoresComparisonData = await getPerformance(
                formatDateForAPI(lyStart),
                formatDateForAPI(lyEnd),
                [] // No store filter for charts
              );
            }
          }
        }
        setAllStoresPerformanceDataLY(allStoresComparisonData);
      }

      // Handle last week comparison data for all stores
      if (isCurrentWeek && storeFilters.length > 0) {
        console.log('📊 Loading all-stores last week data for charts');
        // Recalculate lastWeek variables in correct scope
        const lastWeekForAllStores = getLastWeek();
        const todayForAllStores = new Date();
        const currentWeekStartForAllStores = getCurrentWeek().start;
        const daysIntoWeekForAllStores = Math.floor((todayForAllStores.getTime() - currentWeekStartForAllStores.getTime()) / (1000 * 60 * 60 * 24));
        const lastWeekComparisonEndForAllStores = new Date(lastWeekForAllStores.start);
        lastWeekComparisonEndForAllStores.setDate(lastWeekComparisonEndForAllStores.getDate() + daysIntoWeekForAllStores);
        
        const allStoresLWData = await getPerformance(
          formatDateForAPI(lastWeekForAllStores.start),
          formatDateForAPI(lastWeekComparisonEndForAllStores),
          [] // No store filter for charts
        );
        // Note: We're reusing the LY state for last week all-stores data since charts use the same comparison logic
        setAllStoresPerformanceDataLY(allStoresLWData);
      }

      console.log('✅ Date range update completed using optimal data sources');

    } catch (error) {
      console.error('❌ Error updating data for date range:', error);
    } finally {
      setRefreshing(false);
      // Note: Not setting chartsLoading here since yearly charts don't depend on date ranges
      setLoading(false); // Hide loading overlay after month-to-date data is fully loaded
    }
  }, [dateRange, selectedStore, selectedDistrict, storeInfo, weeklySnapshots]); // Add store dependencies

  // Initial data loading function (only runs once on page load)
  const loadInitialData = useCallback(async () => {
    console.log('🚀 loadInitialData called - initial page load');
    
    setLoading(true);
    setHasInitialDataLoaded(false);

    try {
      // Load store info
      const stores = await getStoreInfo();
      setStoreInfo(stores);
      console.log('✅ Store info loaded');

      // === STEP 1: Load month-to-date data for immediate display and remove main loading overlay ===
      const currentDate = new Date();
      const fiscalMTD = getFiscalMonthToDate();
      const lastYearFiscalMTD = getLastYearFiscalMonthToDate();
      
      console.log('📊 Loading month-to-date data for immediate display...');
      
      // Check if current week is incomplete and within MTD period
      const currentWeek = getCurrentWeek();
      const isCurrentWeekInMTD = currentWeek.start >= fiscalMTD.start && currentWeek.start <= fiscalMTD.end;
      const isCurrentWeekComplete = currentWeek.end <= fiscalMTD.end;
      
      let currentMTDSnapshots: WeeklySnapshot[] = [];
      let currentWeekPerformanceData: DailyPerformance[] = [];
      
      if (isCurrentWeekInMTD && !isCurrentWeekComplete) {
        console.log('📊 Current week is incomplete within MTD period, using hybrid approach');
        
        // Load snapshots for complete weeks in MTD period (up to start of current week)
        const completeWeeksEnd = new Date(currentWeek.start);
        completeWeeksEnd.setDate(completeWeeksEnd.getDate() - 1); // Day before current week starts
        
        if (completeWeeksEnd >= fiscalMTD.start) {
          currentMTDSnapshots = await getSnapshots(
            formatDateForAPI(fiscalMTD.start),
            formatDateForAPI(completeWeeksEnd),
            [] // No store filtering to get all stores
          );
        }
        
        // Load performance data for current incomplete week
        currentWeekPerformanceData = await getPerformance(
          formatDateForAPI(currentWeek.start),
          formatDateForAPI(fiscalMTD.end), // MTD end (yesterday)
          [] // No store filtering to get all stores
        );
      } else {
        // Load complete month-to-date snapshots (no incomplete week issue)
        currentMTDSnapshots = await getSnapshots(
          formatDateForAPI(fiscalMTD.start),
          formatDateForAPI(fiscalMTD.end),
          [] // No store filtering to get all stores
        );
      }
      
      // Load last year month-to-date snapshots for comparison
      const lastYearMTDSnapshots = await getSnapshots(
        formatDateForAPI(lastYearFiscalMTD.start),
        formatDateForAPI(lastYearFiscalMTD.end),
        [] // No store filtering to get all stores
      );
      
      // Convert current week performance data to snapshot format if we have any
      let currentWeekAsSnapshots: WeeklySnapshot[] = [];
      if (currentWeekPerformanceData.length > 0) {
        // Group performance data by store and create pseudo-snapshots for the current incomplete week
        const storeGroups = currentWeekPerformanceData.reduce((acc, perf) => {
          const storeKey = perf.StoreNbr || perf.ID || '';
          if (!acc[storeKey]) {
            acc[storeKey] = [];
          }
          acc[storeKey].push(perf);
          return acc;
        }, {} as Record<string, DailyPerformance[]>);
        
        currentWeekAsSnapshots = Object.entries(storeGroups).map(([storeNbr, perfData]) => {
          // Aggregate performance data into snapshot format
          const totalSales = perfData.reduce((sum, p) => sum + (p.SalesSubTotal || 0), 0);
          const totalFoodSales = perfData.reduce((sum, p) => sum + (p.FoodSales || 0), 0);
          const totalBeerSales = perfData.reduce((sum, p) => sum + (p.BeerSales || 0), 0);
          const totalLiquorSales = perfData.reduce((sum, p) => sum + (p.LiquorSales || 0), 0);
          const totalCovers = perfData.reduce((sum, p) => sum + (p.Covers || 0), 0);
          const totalLaborCost = perfData.reduce((sum, p) => sum + (p.total_labor_cost || 0), 0);
          const totalLaborHours = perfData.reduce((sum, p) => sum + (p.total_labor_hours || 0), 0);
          
          return {
            StoreNbr: storeNbr,
            period_end: formatDateForAPI(currentWeek.end), // Use current week end as period_end
            SalesSubtotal: totalSales,
            FoodSales: totalFoodSales,
            BeerSales: totalBeerSales,
            LiquorSales: totalLiquorSales,
            covers: totalCovers,
            total_labor_cost: totalLaborCost,
            revenue_per_labor_hr: totalLaborHours > 0 ? totalSales / totalLaborHours : 0,
            // Add other fields with default values to match WeeklySnapshot interface
            iso_year: currentWeek.end.getFullYear(),
            week_number: Math.ceil((currentWeek.end.getTime() - new Date(currentWeek.end.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
            FoodCost: 0,
            PaperCost: 0,
            LiquorCost: 0,
            BeerCost: 0,
            AlcoholCost: 0,
            DiscountCostPercent: 0,
            FoodCostPercent: 0,
            LiquorCostPercent: 0,
            BeerCostPercent: 0,
            AlcoholCostPercent: 0,
            LiquorPourCostPercent: 0,
            BeerPourCostPercent: 0,
            AlcoholPourCostPercent: 0,
            flpda_net2: 0,
            total_flpda_pct: 0
          } as WeeklySnapshot;
        });
      }
      
      // Combine all MTD data: complete weeks + current incomplete week + last year data
      const mtdSnapshots = [...currentMTDSnapshots, ...currentWeekAsSnapshots, ...lastYearMTDSnapshots];
      
      setWeeklySnapshots(mtdSnapshots);
      setHistoricalSnapshots(mtdSnapshots); // Show MTD data initially in the table
      console.log('✅ Month-to-date data loaded for immediate display:', {
        currentSnapshots: currentMTDSnapshots.length,
        currentWeekPerformance: currentWeekAsSnapshots.length,
        lastYear: lastYearMTDSnapshots.length,
        total: mtdSnapshots.length,
        hasIncompleteWeek: currentWeekAsSnapshots.length > 0
      });

      // Mark initial data as loaded and remove main loading overlay
      setHasInitialDataLoaded(true);
      setLoading(false); // Remove main loading overlay after MTD data is loaded
      
      // === STEP 2: Load comprehensive historical data in background for charts ===
      const requiredYears = getRequiredYearsBack();
      console.log(`📊 Starting background load of full ${requiredYears} years historical data for charts...`);
      
      // Calculate required years back from current date to ensure we get complete coverage
      const yearsBackDate = new Date(currentDate);
      yearsBackDate.setFullYear(currentDate.getFullYear() - requiredYears);
      
      const allSnapshots = await getSnapshots(
        formatDateForAPI(yearsBackDate),
        formatDateForAPI(currentDate),
        [] // Empty array = no store filtering, get ALL stores
      );
      
      setWeeklySnapshots(allSnapshots);
      setHistoricalSnapshots(allSnapshots); // Set the separate historical data for the table
      
      // Mark initial years as loaded
      const currentYear = new Date().getFullYear();
      setLoadedYears(new Set([currentYear, currentYear - 1]));
      
      console.log(`✅ Full historical snapshots loaded in background (${requiredYears} years):`, {
        records: allSnapshots.length,
        dateRange: `${formatDateForAPI(yearsBackDate)} to ${formatDateForAPI(currentDate)}`
      });
      
      // Now that we have full historical data, charts can show proper year-over-year data
      setHasHistoricalData(true);
      setYearlyChartsLoading(false); // Remove yearly chart loading overlays
      setChartsLoading(false); // Remove other chart loading overlays

    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      setLoading(false);
      setYearlyChartsLoading(false);
      setChartsLoading(false);
      setHasHistoricalData(false);
    }
  }, []); // No dependencies - only runs once

  // Load initial data on page load
  useEffect(() => {
    loadInitialData();
  }, []); // Only run once on mount

  // Load additional year data when new years are enabled
  const loadAdditionalYearData = useCallback(async (targetYear: number) => {
    if (!hasInitialDataLoaded || loadedYears.has(targetYear)) {
      return; // Don't load if not ready or already loaded
    }
    
    console.log(`📊 Loading additional data for year ${targetYear}...`);
    setYearlyChartsLoading(true);
    
    try {
      const yearStart = new Date(targetYear, 0, 1);
      const yearEnd = new Date(targetYear, 11, 31);
      
      const additionalSnapshots = await getSnapshots(
        formatDateForAPI(yearStart),
        formatDateForAPI(yearEnd),
        [] // All stores
      );
      
      console.log(`✅ Loaded ${additionalSnapshots.length} additional snapshots for ${targetYear}`);
      
      // Filter out any snapshots that might already exist to prevent duplicates
      setWeeklySnapshots(prev => {
        const existingDates = new Set(prev.map(s => `${s.StoreNbr}-${s.period_end}`));
        const newSnapshots = additionalSnapshots.filter(s => 
          !existingDates.has(`${s.StoreNbr}-${s.period_end}`)
        );
        console.log(`📊 Adding ${newSnapshots.length} new snapshots (filtered ${additionalSnapshots.length - newSnapshots.length} duplicates)`);
        return [...prev, ...newSnapshots];
      });
      
      setHistoricalSnapshots(prev => {
        const existingDates = new Set(prev.map(s => `${s.StoreNbr}-${s.period_end}`));
        const newSnapshots = additionalSnapshots.filter(s => 
          !existingDates.has(`${s.StoreNbr}-${s.period_end}`)
        );
        return [...prev, ...newSnapshots];
      });
      
      // Mark this year as loaded
      setLoadedYears(prev => new Set([...prev, targetYear]));
      
    } catch (error) {
      console.error(`❌ Error loading data for year ${targetYear}:`, error);
    } finally {
      setYearlyChartsLoading(false);
    }
  }, [hasInitialDataLoaded, loadedYears]);

  // Handle enabled years changes
  useEffect(() => {
    if (!hasInitialDataLoaded) return;
    
    const currentYear = new Date().getFullYear();
    
    if (enabledYears.twoYearsAgo && !loadedYears.has(currentYear - 2)) {
      loadAdditionalYearData(currentYear - 2);
    }
    if (enabledYears.threeYearsAgo && !loadedYears.has(currentYear - 3)) {
      loadAdditionalYearData(currentYear - 3);
    }
    if (enabledYears.fourYearsAgo && !loadedYears.has(currentYear - 4)) {
      loadAdditionalYearData(currentYear - 4);
    }
  }, [enabledYears, hasInitialDataLoaded, loadedYears, loadAdditionalYearData]);

  // Load data for current date range when initial data is ready
  useEffect(() => {
    if (hasInitialDataLoaded && weeklySnapshots.length > 0 && dateRange?.from && dateRange?.to) {
      console.log('🔄 Loading data for current date range - initial load completed');
      updateDataForDateRange();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitialDataLoaded]); // Only when initial data flag is set

  // Handle date range changes (but not on initial load)
  useEffect(() => {
    if (hasInitialDataLoaded && weeklySnapshots.length > 0 && dateRange?.from && dateRange?.to) {
      console.log('🔄 Date range changed, updating data');
      updateDataForDateRange();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]); // Only when date range changes

  // Handle store filter changes
  useEffect(() => {
    if (hasInitialDataLoaded && weeklySnapshots.length > 0 && dateRange?.from && dateRange?.to) {
      console.log('🔄 Store filter changed, updating data');
      updateDataForDateRange();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore, selectedDistrict]); // When store filters change

  const handleDateChange = (newDateRange: DateRange | undefined) => {
    console.log('📅 handleDateChange called with:', {
      from: newDateRange?.from?.toDateString(),
      to: newDateRange?.to?.toDateString(),
      hasInitialData: hasInitialDataLoaded
    });
    setDateRange(newDateRange);
  };

  const handleStoreChange = (store: string) => {
    console.log('🏪 handleStoreChange called with:', store);
    setSelectedStore(store);
    // Clear district when store is selected
    if (store) {
      setSelectedDistrict('');
    }
  };

  const handleDistrictChange = (district: string) => {
    console.log('🏢 handleDistrictChange called with:', district);
    setSelectedDistrict(district);
    // Clear store when district is selected
    if (district) {
      setSelectedStore('');
    }
  };

  const handleTimeframeChange = (timeframe: string) => {
    console.log('📅 Timeframe changed:', timeframe);
    setSelectedTimeframe(timeframe);
  };

  const handleRefreshData = () => {
    console.log('🔄 handleRefreshData called - forcing full reload');
    // Reset flags and force reload all data including historical snapshots
    setHasInitialDataLoaded(false);
    loadInitialData();
  };


  if (loading && !storeInfo) {
    return <div className="flex items-center justify-center h-64"></div>;
  }

  // 🔧 Normalize to an array once and use it everywhere
  const sampleStoreId = allStores[0]?.StoreNbr || '1001';

  // Calculate gross sales by store for heatmap (always use all stores data)
  const grossSalesByStore = calculateGrossSalesByStore(allStoresPerformanceData);
  
  // Calculate comp sales by store for top/bottom table (always use all stores data)
  const allStoresComparisonData = allStoresPerformanceDataLY; // This handles both LY and LW
  const compSalesByStore = calculateCompSalesByStore(allStoresPerformanceData, allStoresComparisonData);
  
  // Keep filtered data for KPIs
  const comparisonData = isCurrentWeekSelected ? performanceDataLW : performanceDataLY;
  
  // Only include stores that have actual performance data for the heatmap
  const storesWithData = Object.keys(grossSalesByStore);
  const storesWithGrossSales = storesWithData
    .map(storeNbr => {
      // Find store info for this store number
      const storeInfo = allStores.find(s => s.StoreNbr === storeNbr) || { StoreNbr: storeNbr };
      return {
        ...storeInfo,
        grossSales: grossSalesByStore[storeNbr] || 0
      };
    })
    .filter(store => store.grossSales > 0) // Only include stores with actual sales
    .sort((a, b) => {
      // Extract numeric part from store numbers (handle both "we123" and "123" formats)
      const extractNumber = (storeNbr: string | number) => {
        const str = String(storeNbr);
        const match = str.match(/\d+/); // Extract first sequence of digits
        return match ? parseInt(match[0], 10) : 0;
      };
      
      const storeNumA = extractNumber(a.StoreNbr);
      const storeNumB = extractNumber(b.StoreNbr);
      return storeNumA - storeNumB;
    });

  // Add comp sales to each store for top/bottom table (use all stores for this)
  const storesWithCompSales = allStores.map(store => ({
    ...store,
    compSales: compSalesByStore[store.StoreNbr] || 0
  }));
  const stores = allStores;

  const netSales = calculateNetSales(performanceData);
  const grossSales = calculateGrossSales(performanceData);
  const guestCount = calculateGuestCount(performanceData);

  // Use the same comparison data for KPI calculations
  const netSalesComparison = calculateNetSales(comparisonData);
  const grossSalesComparison = calculateGrossSales(comparisonData);
  const guestCountComparison = calculateGuestCount(comparisonData);

  // Calculate formatted date ranges for tooltips
  const currentPeriodFormatted = dateRange ? {
    start: dateRange.from?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || '',
    end: dateRange.to?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || ''
  } : undefined;
  
  const lastYearPeriodFormatted = (lyStartDate && lyEndDate) ? {
    start: lyStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    end: lyEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } : undefined;

  const kpis = {
    netSales,
    netSalesComparison,
    grossSales,
    grossSalesComparison,
    guestCount,
    guestCountComparison,
    avgCheck: calculateAvgCheck(netSales, guestCount),
    avgCheckComparison: calculateAvgCheck(netSalesComparison, guestCountComparison),
    carryoutPercent: calculateCarryoutPercent(performanceData),
    carryoutPercentComparison: calculateCarryoutPercent(comparisonData),
    laborPercent: calculateLaborPercent(performanceData),
    laborPercentComparison: calculateLaborPercent(comparisonData),
    foodCostPercent: toNumber(weeklySnapshots[0]?.FoodCostPercent) * 100 || 32.5,
    foodCostPercentComparison: toNumber(weeklySnapshots[52]?.FoodCostPercent) * 100 || 33.1,
    discountsPercent: calculateDiscountsPercent(performanceData),
    discountsPercentComparison: calculateDiscountsPercent(comparisonData),
    foundationDonations: Array.isArray(performanceData)
      ? performanceData.reduce((acc, p) => acc + toNumber(p.FoundationDonations), 0)
      : 0,
    foundationDonationsComparison: Array.isArray(comparisonData)
      ? comparisonData.reduce((acc, p) => acc + toNumber(p.FoundationDonations), 0)
      : 0,
    tableTurnTime: calculateTableTurnTime(performanceData),
    tableTurnTimeComparison: calculateTableTurnTime(comparisonData),
  };

  return (
    <div className="flex min-h-screen w-full flex-col relative">
      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">Loading Initial Data</p>
              <p className="text-sm text-muted-foreground mt-1">Fetching month-to-date metrics and year-over-year comparisons...</p>
            </div>
          </div>
        </div>
      )}
      <DashboardHeader 
        storeInfo={stores} 
        onDateChange={handleDateChange}
        onStoreChange={handleStoreChange}
        onDistrictChange={handleDistrictChange}
        onTimeframeChange={handleTimeframeChange}
        selectedTimeframe={selectedTimeframe}
        onRefresh={handleRefreshData}
        refreshing={refreshing}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <DualKpiCard 
            title="Sales" 
            leftLabel="Gross Sales" 
            leftValue={kpis.grossSales} 
            leftValueLY={kpis.grossSalesComparison}
            rightLabel="Net Sales" 
            rightValue={kpis.netSales} 
            rightValueLY={kpis.netSalesComparison}
            format="currency"
            isCurrentWeek={isCurrentWeekSelected}
            currentPeriod={currentPeriodFormatted}
            lastYearPeriod={lastYearPeriodFormatted}
          />
          <KpiCard title="Guest Count" value={kpis.guestCount} valueLY={kpis.guestCountComparison} isCurrentWeek={isCurrentWeekSelected} currentPeriod={currentPeriodFormatted} lastYearPeriod={lastYearPeriodFormatted} />
          <KpiCard title="Avg. Check" value={kpis.avgCheck} valueLY={kpis.avgCheckComparison} format="currency" isCurrentWeek={isCurrentWeekSelected} currentPeriod={currentPeriodFormatted} lastYearPeriod={lastYearPeriodFormatted} />
          <KpiCard title="Carryout %" value={kpis.carryoutPercent} valueLY={kpis.carryoutPercentComparison} format="percent" isCurrentWeek={isCurrentWeekSelected} currentPeriod={currentPeriodFormatted} lastYearPeriod={lastYearPeriodFormatted} />
          <KpiCard title="Labor %" value={kpis.laborPercent} valueLY={kpis.laborPercentComparison} format="percent" positiveIsGood={false} isCurrentWeek={isCurrentWeekSelected} currentPeriod={currentPeriodFormatted} lastYearPeriod={lastYearPeriodFormatted} />
          <KpiCard title="Food Cost %" value={kpis.foodCostPercent} valueLY={kpis.foodCostPercentComparison} format="percent" positiveIsGood={false} isCurrentWeek={isCurrentWeekSelected} currentPeriod={currentPeriodFormatted} lastYearPeriod={lastYearPeriodFormatted} />
          <KpiCard title="Discounts %" value={kpis.discountsPercent} valueLY={kpis.discountsPercentComparison} format="percent" positiveIsGood={false} isCurrentWeek={isCurrentWeekSelected} currentPeriod={currentPeriodFormatted} lastYearPeriod={lastYearPeriodFormatted} />
          <KpiCard title="Foundation Donations" value={kpis.foundationDonations} valueLY={kpis.foundationDonationsComparison} format="currency" isCurrentWeek={isCurrentWeekSelected} currentPeriod={currentPeriodFormatted} lastYearPeriod={lastYearPeriodFormatted} />
          <KpiCard title="Table Turn Time" value={kpis.tableTurnTime} valueLY={kpis.tableTurnTimeComparison} format="minutes" positiveIsGood={false} isCurrentWeek={isCurrentWeekSelected} currentPeriod={currentPeriodFormatted} lastYearPeriod={lastYearPeriodFormatted} />
          <KpiCard title="SOCi Rating" value="{kpis.sociRating}" valueLY={kpis.sociRatingComparison} isCurrentWeek={isCurrentWeekSelected} currentPeriod={currentPeriodFormatted} lastYearPeriod={lastYearPeriodFormatted} />
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Store Sales Heatmap</CardTitle>
              <CardDescription>Gross Sales for Period</CardDescription>
            </CardHeader>
            <CardContent>
              {/* ✅ pass stores with gross sales data */}
              <StoreHeatmap stores={storesWithGrossSales} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Top / Bottom 5 Stores</CardTitle>
              <CardDescription>By Gross Sales for Period</CardDescription>
            </CardHeader>
            <CardContent>
              {/* ✅ use gross sales data like the heatmap */}
              <TopBottomTable stores={storesWithGrossSales} />
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
            </CardHeader>
            <CardContent className="pl-2 relative">
              {showYearlyChartsLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm text-muted-foreground">Loading YTD and comparison data...</span>
                  </div>
                </div>
              )}
              <SalesTrendChart 
                data={salesTrendData} 
                yearLabels={yearLabels} 
                enabledYears={enabledYears}
                onEnabledYearsChange={setEnabledYears}
              />
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Labor % of Sales by State</CardTitle>
            </CardHeader>
            <CardContent className="pl-2 relative">
              {showYearlyChartsLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm text-muted-foreground">Loading YTD and comparison data...</span>
                  </div>
                </div>
              )}
              <LaborChart data={laborChartData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Costs % of Sales</CardTitle>
            </CardHeader>
            <CardContent className="pl-2 relative">
              {showYearlyChartsLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm text-muted-foreground">Loading YTD and comparison data...</span>
                  </div>
                </div>
              )}
              <CostBarsChart data={costChartData} />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Snapshot</CardTitle>
              <CardDescription>Key metrics from weekly rollups.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full whitespace-nowrap">
                <WeeklySnapshotTable
                  snapshots={Array.isArray(historicalSnapshots) ? historicalSnapshots : []}
                />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
