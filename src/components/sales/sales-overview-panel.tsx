"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, ShoppingCart, Building2, User, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useSales } from "@/hooks/sales";
import type { Sale } from "@/services/sale.service";

const columns: ColumnDef<TableFeatures, Sale>[] = [
  {
    accessorKey: "reference",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Reference
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-sm text-faint">{row.getValue("reference")}</span>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return type === "BUSINESS" ? (
        <Badge variant="default" className="gap-1">
          <Building2 className="size-3" />
          BUSINESS
        </Badge>
      ) : (
        <Badge variant="success" className="gap-1">
          <User className="size-3" />
          CONSUMER
        </Badge>
      );
    },
  },
  {
    id: "buyer",
    header: "Buyer",
    cell: ({ row }) => {
      const sale = row.original;
      if (sale.type === "CONSUMER") {
        return (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <User className="size-3.5" />
            {sale.consumerRef || "Consumer"}
          </div>
        );
      }
      return (
        <div className="flex items-center gap-1.5 text-sm">
          <Building2 className="size-3.5 text-primary" />
          {sale.buyerOrganizationName || "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "lines",
    header: "Items",
    cell: ({ row }) => {
      const lines = row.getValue("lines") as Sale["lines"];
      return <span className="text-sm">{lines?.length ?? 0} item(s)</span>;
    },
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Amount
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = row.getValue("totalAmount") as string | null;
      return amount ? (
        <span className="text-sm font-medium">{Number(amount).toLocaleString()} RWF</span>
      ) : "—";
    },
  },
  {
    accessorKey: "soldAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const d = new Date(row.getValue("soldAt") as string);
      return (
        <div className="text-sm">
          <p>{d.toLocaleDateString()}</p>
          <p className="text-xs text-muted-foreground">{d.toLocaleTimeString()}</p>
        </div>
      );
    },
  },
];

export function SalesOverviewPanel({ preferPos = false }: { preferPos?: boolean }) {
  const { data, isLoading } = useSales();
  const sales = data?.content ?? [];
  const total = data?.total ?? 0;

  const businessSales = sales.filter((s) => s.type === "BUSINESS").length;
  const consumerSales = sales.filter((s) => s.type === "CONSUMER").length;
  const totalRevenue = sales.reduce(
    (sum, s) => sum + (s.totalAmount ? Number(s.totalAmount) : 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-prose text-sm text-muted-foreground">
          Completed sales that already left stock. For the till, use Point of sale. For quotes and
          invoices, use the tabs above.
        </p>
        <div className="flex flex-wrap gap-2">
          {preferPos ? (
            <>
              <Button nativeButton={false} render={<Link href="/dashboard/sales/pos" />}>
                <Plus className="mr-2 size-4" />
                Open point of sale
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/dashboard/sales/new" />}
              >
                Business sale
              </Button>
            </>
          ) : (
            <>
              <Button nativeButton={false} render={<Link href="/dashboard/sales/new" />}>
                <Plus className="mr-2 size-4" />
                New sale
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/dashboard/sales/pos" />}
              >
                Point of sale
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard
          title="Total sales"
          value={total}
          icon={<ShoppingCart className="size-4" />}
          iconBg="bg-primary"
          caption="All recorded transactions"
        />
        <MetricCard
          title="Revenue"
          value={totalRevenue > 0 ? `${totalRevenue.toLocaleString()} RWF` : "—"}
          icon={<DollarSign className="size-4" />}
          iconBg="bg-success"
          caption="Total sales value"
        />
        <MetricCard
          title="Business sales"
          value={businessSales}
          badge={total > 0 ? `${Math.round((businessSales / total) * 100)}%` : undefined}
          badgeType="neutral"
          icon={<Building2 className="size-4" />}
          iconBg="bg-primary"
          caption="To another business"
        />
        <MetricCard
          title="Consumer sales"
          value={consumerSales}
          badge={total > 0 ? `${Math.round((consumerSales / total) * 100)}%` : undefined}
          badgeType="neutral"
          icon={<User className="size-4" />}
          iconBg="bg-success"
          caption="End of chain"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales history</CardTitle>
          <CardDescription>
            {total} sale{total === 1 ? "" : "s"} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Loading sales…
            </div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <ShoppingCart className="size-8 text-border" />
              <div>
                <p className="text-sm font-medium text-foreground">No sales recorded yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {preferPos
                    ? "Open Point of sale to scan items at the counter."
                    : "Record a sale to another business, or use Point of sale for the till."}
                </p>
              </div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={sales}
              filterPlaceholder="Search by reference…"
              filterColumn="reference"
              pageSize={10}
              noBorder
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
