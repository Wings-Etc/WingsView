"use client";

import * as React from "react";
import type { StoreInfo } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";

interface TopBottomTableProps {
  stores: StoreInfo[];
}

export function TopBottomTable({ stores }: TopBottomTableProps) {
  const sortedStores = React.useMemo(
    () => [...stores].sort((a, b) => b.compSales - a.compSales),
    [stores]
  );

  const top5 = sortedStores.slice(0, 5);
  const bottom5 = sortedStores.slice(-5).reverse();

  const renderRow = (store: StoreInfo) => {
    const isPositive = store.compSales >= 0;
    return (
      <TableRow key={store.StoreNbr}>
        <TableCell className="font-medium">#{store.StoreNbr}</TableCell>
        <TableCell>{store.District}</TableCell>
        <TableCell className="text-right">
          <div
            className={`flex items-center justify-end ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositive ? (
              <ArrowUp className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDown className="h-4 w-4 mr-1" />
            )}
            {store.compSales.toFixed(1)}%
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div>
        <h3 className="font-semibold mb-2">Top 5 Performers</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Store</TableHead>
                <TableHead>District</TableHead>
                <TableHead className="text-right">Comp %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{top5.map(renderRow)}</TableBody>
          </Table>
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Bottom 5 Performers</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Store</TableHead>
                <TableHead>District</TableHead>
                <TableHead className="text-right">Comp %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{bottom5.map(renderRow)}</TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
