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
  }).format(value);

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

export function WeeklySnapshotTable({ snapshots }: WeeklySnapshotTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Week</TableHead>
            <TableHead className="text-right">Sales</TableHead>
            <TableHead className="text-right">Food %</TableHead>
            <TableHead className="text-right">Alcohol Pour %</TableHead>
            <TableHead className="text-right">Labor %</TableHead>
            <TableHead className="text-right">Covers</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {snapshots.map((s) => (
            <TableRow key={s.start_date}>
              <TableCell className="font-medium">{s.start_date}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(s.SalesSubtotal)}
              </TableCell>
              <TableCell className="text-right">
                {formatPercent(s.FoodCostPercent)}
              </TableCell>
              <TableCell className="text-right">
                {formatPercent(s.AlcoholPourCostPercent)}
              </TableCell>
              <TableCell className="text-right">
                {formatPercent(s.total_labor_cost / s.SalesSubtotal)}
              </TableCell>
              <TableCell className="text-right">{s.covers}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
