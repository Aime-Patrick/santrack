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

export function SalesOverviewPanel() {
  const { data, isLoading } = useSales();
  const sales = data?.content ?? [];
  const total = data?.total ?? 0;

  const businessSales = sales.filter((s) => s.type === "BUSINESS").length;
  const consumerSales = sales.filter((s) => s.type === "CONSUMER").length;
  const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount ? Number(s.totalAmount) : 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-prose text-sm text-muted-foreground">
          Record a sale now (scan at the till, or sell by piece / carton / box to
          another business). For quotes and invoices, use the Orders tab.
        </p>
        <Button render={<Link href="/dashboard/sales/new" />}>
          <Plus className="mr-2 size-4" />
          New Sale
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard
          title="Total Sales"
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
          title="Business Sales"
          value={businessSales}
          badge={total > 0 ? `${Math.round((businessSales / total) * 100)}%` : undefined}
          badgeType="neutral"
          icon={<Building2 className="size-4" />}
          iconBg="bg-primary"
          caption="Dispatch triggered"
        />
        <MetricCard
          title="Consumer Sales"
          value={consumerSales}
          badge={total > 0 ? `${Math.round((consumerSales / total) * 100)}%` : undefined}
          badgeType="neutral"
          icon={<User className="size-4" />}
          iconBg="bg-success"
          caption="End of chain"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
          <CardDescription>{total} sales recorded</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Loading sales...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={sales}
              filterPlaceholder="Search by reference..."
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
