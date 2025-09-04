import type { DailyPerformance } from '@/types';

const sum = (data: number[]) => data.reduce((acc, val) => acc + val, 0);

// Net Sales = SalesSubTotal – Discounts
export function calculateNetSales(performanceData: DailyPerformance[]): number {
  return sum(performanceData.map(day => day.SalesSubTotal - day.Discounts));
}

// Guest Count = Covers
export function calculateGuestCount(performanceData: DailyPerformance[]): number {
    return sum(performanceData.map(day => day.Covers));
}

// Avg Check = Net Sales / Covers
export function calculateAvgCheck(netSales: number, guestCount: number): number {
    return guestCount > 0 ? netSales / guestCount : 0;
}

// Carryout % = ToGo / Net Sales
export function calculateCarryoutPercent(performanceData: DailyPerformance[]): number {
    const totalNetSales = calculateNetSales(performanceData);
    const totalToGo = sum(performanceData.map(day => day.ToGo));
    return totalNetSales > 0 ? (totalToGo / totalNetSales) * 100 : 0;
}

// Labor % of Sales = total_labor_cost / Net Sales
export function calculateLaborPercent(performanceData: DailyPerformance[]): number {
    const totalNetSales = calculateNetSales(performanceData);
    const totalLabor = sum(performanceData.map(day => day.total_labor_dollars));
    return totalNetSales > 0 ? (totalLabor / totalNetSales) * 100 : 0;
}

// Discounts % = Discounts / SalesSubTotal
export function calculateDiscountsPercent(performanceData: DailyPerformance[]): number {
    const totalSalesSubTotal = sum(performanceData.map(day => day.SalesSubTotal));
    const totalDiscounts = sum(performanceData.map(day => day.Discounts));
    return totalSalesSubTotal > 0 ? (totalDiscounts / totalSalesSubTotal) * 100 : 0;
}
