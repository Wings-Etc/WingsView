import type { StoreInfo, DailyPerformance, WeeklySnapshot } from '@/types';

const STORES_COUNT = 80;
const DISTRICTS = ['District A', 'District B', 'District C', 'District D', 'District E'];
const COMPANIES = ['Company Owned', 'Franchise'];

const generateRandomStore = (i: number): StoreInfo => {
  const storeNbr = (1000 + i).toString();
  return {
    StoreNbr: storeNbr,
    Company: COMPANIES[i % COMPANIES.length],
    District: DISTRICTS[i % DISTRICTS.length],
    State: 'IN',
    Royalty: 0.05,
    compSales: (Math.random() - 0.3) * 15, // Random comp sales % between roughly -4.5% and +10.5%
  };
};

export const mockStoreInfo: StoreInfo[] = Array.from({ length: STORES_COUNT }, (_, i) => generateRandomStore(i));

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

export const getMockPerformance = (startDate: Date, endDate: Date, storeNbr: string): DailyPerformance[] => {
  const data: DailyPerformance[] = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const salesSubTotal = rand(2000, 8000);
    const discounts = salesSubTotal * rand(0.05, 0.15);
    const covers = Math.floor(rand(80, 250));
    data.push({
      Date: d.toISOString().split('T')[0],
      StoreNbr: storeNbr,
      BeerSales: salesSubTotal * rand(0.2, 0.3),
      SalesSubTotal: salesSubTotal,
      Discounts: discounts,
      Covers: covers,
      Entrees: covers * rand(0.9, 1.2),
      ToGo: salesSubTotal * rand(0.15, 0.35),
      WebTotal: salesSubTotal * rand(0.05, 0.1),
      FoundationDonations: rand(0, 50),
      total_labor_dollars: salesSubTotal * rand(0.25, 0.35),
      total_labor_hours: (salesSubTotal * rand(0.25, 0.35)) / rand(15, 20),
    });
  }
  return data;
};


export const getMockSnapshots = (startDate: Date, endDate: Date, storeNbrs: string[]): WeeklySnapshot[] => {
  const snapshots: WeeklySnapshot[] = [];
  storeNbrs.forEach(storeNbr => {
    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 7)) {
        const weekStart = new Date(d);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        if (weekEnd > endDate) break;

        const salesSubtotal = rand(20000, 50000);
        snapshots.push({
            start_date: weekStart.toISOString().split('T')[0],
            end_date: weekEnd.toISOString().split('T')[0],
            StoreNbr: storeNbr,
            SalesSubtotal: salesSubtotal,
            FoodSales: salesSubtotal * rand(0.6, 0.7),
            BeerSales: salesSubtotal * rand(0.1, 0.15),
            LiquorSales: salesSubtotal * rand(0.05, 0.1),
            total_labor_cost: salesSubtotal * rand(0.28, 0.33),
            revenue_per_labor_hr: rand(45, 75),
            covers: Math.floor(rand(700, 1500)),
            FoodCostPercent: rand(0.3, 0.35),
            LiquorCostPercent: rand(0.18, 0.22),
            BeerCostPercent: rand(0.2, 0.25),
            AlcoholCostPercent: rand(0.2, 0.24),
            LiquorPourCostPercent: rand(0.18, 0.22),
            BeerPourCostPercent: rand(0.2, 0.25),
            AlcoholPourCostPercent: rand(0.2, 0.24),
            flpda_net2: rand(1000, 5000),
            total_flpda_pct: rand(0.02, 0.05),
        });
    }
  });
  return snapshots;
};
