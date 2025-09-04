import { getStoreInfo, getSnapshots, getPerformance } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DashboardHeader } from '@/components/dashboard/header';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { SalesTrendChart } from '@/components/dashboard/sales-trend-chart';
import { WeeklySnapshotTable } from '@/components/dashboard/weekly-snapshot-table';
import { TopBottomTable } from '@/components/dashboard/top-bottom-table';
import { StoreHeatmap } from '@/components/dashboard/store-heatmap';
import { CostBarsChart } from '@/components/dashboard/cost-bars-chart';
import {
  calculateAvgCheck,
  calculateCarryoutPercent,
  calculateDiscountsPercent,
  calculateGuestCount,
  calculateLaborPercent,
  calculateNetSales,
} from '@/lib/mappers';
import { LaborChart } from '@/components/dashboard/labor-chart';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const storeInfo = await getStoreInfo();
  
  const today = new Date();
  const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));
  const yearAgo = new Date(new Date().setFullYear(today.getFullYear() - 1));
  const yearAgoThirtyDaysAgo = new Date(new Date(yearAgo).setDate(yearAgo.getDate() - 30));

  // For company-wide KPIs, we'd aggregate across all stores. For this mock, we'll use a sample.
  const sampleStoreId = storeInfo[0]?.StoreNbr || '1001';
  const performanceData = await getPerformance(thirtyDaysAgo.toISOString().split('T')[0], today.toISOString().split('T')[0], sampleStoreId);
  const performanceDataLY = await getPerformance(yearAgoThirtyDaysAgo.toISOString().split('T')[0], yearAgo.toISOString().split('T')[0], sampleStoreId);
  
  const weeklySnapshots = await getSnapshots(yearAgo.toISOString().split('T')[0], today.toISOString().split('T')[0], storeInfo.map(s => s.StoreNbr));

  const netSales = calculateNetSales(performanceData);
  const netSalesLY = calculateNetSales(performanceDataLY);
  
  const guestCount = calculateGuestCount(performanceData);
  const guestCountLY = calculateGuestCount(performanceDataLY);

  const kpis = {
    netSales,
    netSalesLY,
    guestCount,
    guestCountLY,
    avgCheck: calculateAvgCheck(netSales, guestCount),
    avgCheckLY: calculateAvgCheck(netSalesLY, guestCountLY),
    carryoutPercent: calculateCarryoutPercent(performanceData),
    carryoutPercentLY: calculateCarryoutPercent(performanceDataLY),
    laborPercent: calculateLaborPercent(performanceData),
    laborPercentLY: calculateLaborPercent(performanceDataLY),
    foodCostPercent: weeklySnapshots[0]?.FoodCostPercent * 100 || 32.5,
    foodCostPercentLY: weeklySnapshots[52]?.FoodCostPercent * 100 || 33.1,
    discountsPercent: calculateDiscountsPercent(performanceData),
    discountsPercentLY: calculateDiscountsPercent(performanceDataLY),
    foundationDonations: performanceData.reduce((acc, p) => acc + p.FoundationDonations, 0),
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <DashboardHeader storeInfo={storeInfo} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
          <KpiCard title="Net Sales" value={kpis.netSales} valueLY={kpis.netSalesLY} format="currency" />
          <KpiCard title="Guest Count" value={kpis.guestCount} valueLY={kpis.guestCountLY} />
          <KpiCard title="Avg. Check" value={kpis.avgCheck} valueLY={kpis.avgCheckLY} format="currency" />
          <KpiCard title="Carryout %" value={kpis.carryoutPercent} valueLY={kpis.carryoutPercentLY} format="percent" />
          <KpiCard title="Labor %" value={kpis.laborPercent} valueLY={kpis.laborPercentLY} format="percent" positiveIsGood={false} />
          <KpiCard title="Food Cost %" value={kpis.foodCostPercent} valueLY={kpis.foodCostPercentLY} format="percent" positiveIsGood={false}/>
          <KpiCard title="Discounts %" value={kpis.discountsPercent} valueLY={kpis.discountsPercentLY} format="percent" positiveIsGood={false}/>
          <KpiCard title="Foundation Donations" value={kpis.foundationDonations} format="currency"/>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend vs LY</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <SalesTrendChart />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Labor % of Sales</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <LaborChart />
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Store Comp Heatmap</CardTitle>
              <CardDescription>Net Sales % vs LY</CardDescription>
            </CardHeader>
            <CardContent>
              <StoreHeatmap stores={storeInfo} />
            </CardContent>
          </Card>
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Top / Bottom 5 Stores</CardTitle>
              <CardDescription>By Comp Net Sales %</CardDescription>
            </CardHeader>
            <CardContent>
              <TopBottomTable stores={storeInfo} />
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Cost Analysis</CardTitle>
                    <CardDescription>Food & Alcohol Costs %</CardDescription>
                </CardHeader>
                <CardContent>
                    <CostBarsChart />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Weekly Snapshot</CardTitle>
                    <CardDescription>Key metrics from weekly rollups.</CardDescription>
                </CardHeader>
                <CardContent>
                    <WeeklySnapshotTable snapshots={weeklySnapshots.slice(0, 10)} />
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
