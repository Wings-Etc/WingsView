import type { WeeklySnapshot } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface WeeklySnapshotTableProps {
  snapshots: WeeklySnapshot[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(value);

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

export function WeeklySnapshotTable({ snapshots }: WeeklySnapshotTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Store #</TableHead>
            <TableHead>Week</TableHead>
            <TableHead className="text-right">Sales</TableHead>
            <TableHead className="text-right">Covers</TableHead>
            <TableHead className="text-right">Food Sales</TableHead>
            <TableHead className="text-right">Beer Sales</TableHead>
            <TableHead className="text-right">Liquor Sales</TableHead>
            <TableHead className="text-right">Food Cost %</TableHead>
            <TableHead className="text-right">Beer Cost %</TableHead>
            <TableHead className="text-right">Liquor Cost %</TableHead>
            <TableHead className="text-right">Alcohol Cost %</TableHead>
            <TableHead className="text-right">Labor Cost</TableHead>
            <TableHead className="text-right">Labor %</TableHead>
            <TableHead className="text-right">Rev/Labor Hr</TableHead>
            <TableHead className="text-right">FLPDA %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {snapshots.map((s) => (
            <TableRow key={`${s.StoreNbr}-${s.start_date}`}>
              <TableCell className="font-medium">{s.StoreNbr}</TableCell>
              <TableCell className="font-medium">{s.start_date}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(s.SalesSubtotal)}
              </TableCell>
              <TableCell className="text-right">{s.covers}</TableCell>
              <TableCell className="text-right">{formatCurrency(s.FoodSales)}</TableCell>
              <TableCell className="text-right">{formatCurrency(s.BeerSales)}</TableCell>
              <TableCell className="text-right">{formatCurrency(s.LiquorSales)}</TableCell>
              <TableCell className="text-right">
                {formatPercent(s.FoodCostPercent)}
              </TableCell>
              <TableCell className="text-right">
                {formatPercent(s.BeerCostPercent)}
              </TableCell>
               <TableCell className="text-right">
                {formatPercent(s.LiquorCostPercent)}
              </TableCell>
              <TableCell className="text-right">
                {formatPercent(s.AlcoholCostPercent)}
              </TableCell>
              <TableCell className="text-right">{formatCurrency(s.total_labor_cost)}</TableCell>
              <TableCell className="text-right">
                {formatPercent(s.total_labor_cost / s.SalesSubtotal)}
              </TableCell>
               <TableCell className="text-right">{formatCurrency(s.revenue_per_labor_hr)}</TableCell>
                <TableCell className="text-right">{formatPercent(s.total_flpda_pct)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
