export interface StoreInfo {
  StoreNbr: string;
  Company: string;
  District: string;
  State: string;
  Royalty: number;
  [key: string]: any;
}

export interface DailyPerformance {
  Date: string;
  StoreNbr: string;
  BeerSales: number;
  SalesSubTotal: number;
  Discounts: number;
  Covers: number;
  Entrees: number;
  ToGo: number;
  WebTotal: number;
  FoundationDonations: number;
  total_labor_dollars: number;
  total_labor_hours: number;
  [key: string]: any;
}

export interface WeeklySnapshot {
  StoreNbr: string;
  iso_year: number;
  week_number: number;
  period_end: string;
  SalesSubtotal: number;
  FoodSales: number;
  BeerSales: number;
  LiquorSales: number;
  total_labor_cost: number;
  revenue_per_labor_hr: number;
  covers: number;
  FoodCost: number;
  PaperCost: number;
  LiquorCost: number;
  BeerCost: number;
  AlcoholCost: number;
  DiscountCostPercent: number;
  FoodCostPercent: number;
  LiquorCostPercent: number;
  BeerCostPercent: number;
  AlcoholCostPercent: number;
  LiquorPourCostPercent: number;
  BeerPourCostPercent: number;
  AlcoholPourCostPercent: number;
  flpda_net2: number;
  total_flpda_pct: number;
  ToGo?: number;
  FoundationDonations?: number;
  [key: string]: any;
}

// Simplified types for other endpoints as per description
export type SalesData = DailyPerformance;
export interface InventoryData {
  Date: string;
  StoreNbr: string;
  FoodBegin: number;
  FoodPurchase: number;
  FoodEnd: number;
  PaperBegin: number;
  PaperPurchase: number;
  PaperEnd: number;
  BeerBegin: number;
  BeerPurchase: number;
  BeerEnd: number;
  LiquorBegin: number;
  LiquorPurchase: number;
  LiquorEnd: number;
  [key: string]: any;
}

export interface LaborData {
  Date: string;
  StoreNbr: string;
  Role: string;
  Dollars: number;
  Hours: number;
  [key: string]: any;
}

export interface Kpi {
  netSales: number;
  netSalesLY: number;
  guestCount: number;
  guestCountLY: number;
  avgCheck: number;
  avgCheckLY: number;
  carryoutPercent: number;
  carryoutPercentLY: number;
  laborPercent: number;
  laborPercentLY: number;
  foodCostPercent: number;
  foodCostPercentLY: number;
  alcoholPourCostPercent: number;
  alcoholPourCostPercentLY: number;
  discountsPercent: number;
  discountsPercentLY: number;
  foundationDonations: number;
  foundationDonationsLY: number;
}
