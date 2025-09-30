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
import { safeNumber, toFixedSafe } from "@/lib/utils";

interface TopBottomTableProps {
  stores: StoreInfo[];
}

export function TopBottomTable({ stores }: TopBottomTableProps) {
  // Sanitize once: ensure StoreNbr is a string and grossSales is a finite number
  const rows = React.useMemo(() => {
    const arr = Array.isArray(stores) ? stores : [];
    return arr
      .filter((s) => s && s.StoreNbr != null)
      .map((s) => ({
        ...s,
        StoreNbr: String(s.StoreNbr),
        grossSales: safeNumber((s as any).grossSales, 0),
        City: (s as any).City ?? "",
        State: (s as any).State ?? "",
      }));
  }, [stores]);

  // Sort by grossSales (desc)
  const sortedStores = React.useMemo(
    () => [...rows].sort((a, b) => b.grossSales - a.grossSales),
    [rows]
  );

  const top5 = sortedStores.slice(0, 5);
  const bottom5 = sortedStores.slice(-5).reverse();

  const renderRow = (store: StoreInfo & { grossSales: number }) => {
    const grossSales = safeNumber((store as any).grossSales, 0);
    
    // Extract just the numeric part from store number
    const storeStr = String(store.StoreNbr);
    const match = storeStr.match(/\d+/);
    const displayNum = match ? match[0] : storeStr;
    
    // Format city and state
    const location = `${(store as any).City || ""}, ${(store as any).State || ""}`.replace(/^,\s*|,\s*$/g, '');

    return (
      <TableRow key={String(store.StoreNbr)}>
        <TableCell className="font-medium">#{displayNum}</TableCell>
        <TableCell>{location}</TableCell>
        <TableCell className="text-right">
          <div className="text-gray-900">
            ${Math.round(grossSales).toLocaleString('en-US')}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  if (rows.length === 0) {
    return <div className="text-sm text-muted-foreground">No data</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div>
        <h3 className="font-semibold mb-2">Top 5 Performers</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Store</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Gross Sales</TableHead>
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
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Gross Sales</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{bottom5.map(renderRow)}</TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
