import type { DailyPerformance } from '@/types';

const sum = (data: number[]) => data.reduce((acc, val) => acc + val, 0);

/**
 * Convert a string or number to a valid number for mathematical operations
 * Handles common string formats like currency, percentages, and null/undefined values
 */
export function toNumber(value: string | number | null | undefined): number {
    // Handle null, undefined, or empty values
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    
    // If it's already a number, return it
    if (typeof value === 'number') {
        return isNaN(value) ? 0 : value;
    }
    
    // If it's a string, clean it up and convert
    if (typeof value === 'string') {
        // Remove common non-numeric characters (currency symbols, commas, spaces, etc.)
        const cleaned = value
            .replace(/[$,\s%]/g, '') // Remove $, commas, spaces, %
            .replace(/[()]/g, '')    // Remove parentheses
            .trim();
        
        // Handle empty string after cleaning
        if (cleaned === '') {
            return 0;
        }
        
        // Convert to number
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }
    
    // Fallback for any other type
    return 0;
}

// Gross Sales = SalesSubTotal
export function calculateGrossSales(performanceData: DailyPerformance[]): number {
    if (!Array.isArray(performanceData)) return 0;
    return sum(performanceData.map(day => toNumber(day.SalesSubTotal)));
}

// Net Sales = SalesSubTotal – Discounts
export function calculateNetSales(performanceData: DailyPerformance[]): number {
    if (!Array.isArray(performanceData)) return 0;
    const result = sum(performanceData.map(day => toNumber(day.SalesSubTotal) - toNumber(day.Discounts)));
    return result;
}

// Guest Count = Covers
export function calculateGuestCount(performanceData: DailyPerformance[]): number {
    if (!Array.isArray(performanceData)) return 0;
    return sum(performanceData.map(day => toNumber(day.Covers)));
}

// Avg Check = Net Sales / Covers
export function calculateAvgCheck(netSales: number, guestCount: number): number {
    return guestCount > 0 ? netSales / guestCount : 0;
}

// Carryout % = ToGo / Gross Sales
export function calculateCarryoutPercent(performanceData: DailyPerformance[]): number {
    if (!Array.isArray(performanceData)) return 0;
    const totalGrossSales = sum(performanceData.map(day => toNumber(day.SalesSubTotal)));
    const totalToGo = sum(performanceData.map(day => toNumber(day.ToGo)));
    return totalGrossSales > 0 ? (totalToGo / totalGrossSales) * 100 : 0;
}

// Labor % of Sales = total_labor_cost / Gross Sales
export function calculateLaborPercent(performanceData: DailyPerformance[]): number {
    if (!Array.isArray(performanceData)) {
        return 0;
    }
    
    // Debug: Show what labor fields are available
    if (performanceData.length > 0) {
        const sampleDay = performanceData[0];
        const allFields = Object.keys(sampleDay);
        const laborFields = allFields.filter(key => 
            key.toLowerCase().includes('labor') || 
            key.toLowerCase().includes('dollar') ||
            key.toLowerCase().includes('cost')
        );
    }
    
    const totalSalesSubTotal = sum(performanceData.map(day => toNumber(day.SalesSubTotal)));
    
    // Try multiple labor field variations, including nested labor object
    const totalLabor = sum(performanceData.map(day => {
        // First try direct fields
        let laborCost = toNumber(day.total_labor_cost) || 
                       toNumber(day.total_labor_dollars) ||
                       toNumber(day.TotalLaborCost);
        
        // If no direct field, check if labor is an object with nested values
        if (laborCost === 0 && day.labor && typeof day.labor === 'object') {
            const laborObj = day.labor as any;
            laborCost = toNumber(laborObj.total_cost) || 
                       toNumber(laborObj.total_dollars) ||
                       toNumber(laborObj.cost) ||
                       toNumber(laborObj.dollars) ||
                       // Sum individual job categories from labor object
                       (toNumber(laborObj.ServerDollars) + toNumber(laborObj.KitchenDollars) + 
                        toNumber(laborObj.BartenderDollars) + toNumber(laborObj.ManagerDollars) + 
                        toNumber(laborObj.BarBackDollars) + toNumber(laborObj.HostDollars) + 
                        toNumber(laborObj.ShiftMgrDollars) + toNumber(laborObj.TrainerDollars) + 
                        toNumber(laborObj.TraineeDollars) + toNumber(laborObj.NonKnownJobDollars) + 
                        toNumber(laborObj.TeamDollars));
        }
        
        // Fallback to top-level individual categories
        if (laborCost === 0) {
            laborCost = toNumber(day.ServerDollars) + toNumber(day.KitchenDollars) + 
                       toNumber(day.BartenderDollars) + toNumber(day.ManagerDollars) + 
                       toNumber(day.BarBackDollars) + toNumber(day.HostDollars) + 
                       toNumber(day.ShiftMgrDollars) + toNumber(day.TrainerDollars) + 
                       toNumber(day.TraineeDollars) + toNumber(day.NonKnownJobDollars) + 
                       toNumber(day.TeamDollars);
        }
        
        return laborCost;
    }));
    
    const laborPercent = totalSalesSubTotal > 0 ? (totalLabor / totalSalesSubTotal) * 100 : 0;
    
    
    return laborPercent;
}

// Discounts % = Discounts / SalesSubTotal
export function calculateDiscountsPercent(performanceData: DailyPerformance[]): number {
    if (!Array.isArray(performanceData)) return 0;
    const totalSalesSubTotal = sum(performanceData.map(day => toNumber(day.SalesSubTotal)));
    const totalDiscounts = sum(performanceData.map(day => toNumber(day.Discounts)));
    return totalSalesSubTotal > 0 ? (totalDiscounts / totalSalesSubTotal) * 100 : 0;
}

// Calculate comp sales percentage by store
export function calculateCompSalesByStore(
    currentData: DailyPerformance[], 
    comparisonData: DailyPerformance[]
): Record<string, number> {
    if (!Array.isArray(currentData) || !Array.isArray(comparisonData)) {
        return {};
    }

    // Group current data by store and calculate net sales
    const currentByStore: Record<string, number> = {};
    currentData.forEach(day => {
        const storeNbr = String(day.StoreNbr);
        const netSales = toNumber(day.SalesSubTotal) - toNumber(day.Discounts);
        currentByStore[storeNbr] = (currentByStore[storeNbr] || 0) + netSales;
    });

    // Group comparison data by store and calculate net sales
    const comparisonByStore: Record<string, number> = {};
    comparisonData.forEach(day => {
        const storeNbr = String(day.StoreNbr);
        const netSales = toNumber(day.SalesSubTotal) - toNumber(day.Discounts);
        comparisonByStore[storeNbr] = (comparisonByStore[storeNbr] || 0) + netSales;
    });

    // Calculate comp sales percentage for each store
    const compSalesByStore: Record<string, number> = {};
    Object.keys(currentByStore).forEach(storeNbr => {
        const currentSales = currentByStore[storeNbr];
        const comparisonSales = comparisonByStore[storeNbr] || 0;
        
        if (comparisonSales > 0) {
            compSalesByStore[storeNbr] = ((currentSales - comparisonSales) / comparisonSales) * 100;
        } else {
            compSalesByStore[storeNbr] = 0;
        }
    });

    return compSalesByStore;
}

// Calculate gross sales by store for the time period
export function calculateGrossSalesByStore(performanceData: DailyPerformance[]): Record<string, number> {
    if (!Array.isArray(performanceData)) {
        return {};
    }

    // Group data by store and calculate gross sales (SalesSubTotal)
    const grossSalesByStore: Record<string, number> = {};
    performanceData.forEach(day => {
        const storeNbr = String(day.StoreNbr);
        const grossSales = toNumber(day.SalesSubTotal);
        grossSalesByStore[storeNbr] = (grossSalesByStore[storeNbr] || 0) + grossSales;
    });

    return grossSalesByStore;
}

// Calculate average table turn time in minutes
export function calculateTableTurnTime(performanceData: DailyPerformance[]): number {
    if (!Array.isArray(performanceData)) return 0;
    
    const totalParties = sum(performanceData.map(day => toNumber(day.TurnParties)));
    const totalMinutes = sum(performanceData.map(day => toNumber(day.TurnTotalMinutes)));
    
    if (totalParties === 0) return 0;
    
    return totalMinutes / totalParties;
}
