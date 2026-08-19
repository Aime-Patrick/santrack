"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, Wallet, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useBudgets } from "@/hooks/finance";
import type { Budget } from "@/services/finance.service";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount);
}

const columns: ColumnDef<TableFeatures, Budget>[] = [
  {
    accessorKey: "accountCode",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Account Code
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <Wallet className="size-4" />
        </div>
        <span className="font-mono text-sm">{row.getValue("accountCode")}</span>
      </div>
    ),
  },
  {
    accessorKey: "accountName",
    header: "Account Name",
    cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("accountName")}</span>,
  },
  {
    accessorKey: "costCentreCode",
    header: "Cost Centre",
    cell: ({ row }) => {
      const code = row.getValue("costCentreCode") as string | null;
      return code ? <span className="font-mono text-sm text-faint">{code}</span> : "—";
    },
  },
  {
    accessorKey: "period",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Period
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("period")}</span>,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Amount
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm font-medium">{formatCurrency(row.getValue("amount"))}</span>,
  },
];

export default function BudgetsPage() {
  const { data, isLoading } = useBudgets();
  const budgets = data ?? [];
  const total = budgets.length;
  const totalAmount = budgets.reduce((sum, b) => sum + b.amount, 0);
  const uniquePeriods = new Set(budgets.map((b) => b.period)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Wallet className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Budgets</h1>
            <p className="text-sm text-muted-foreground">Manage budgets across accounts and cost centres.</p>
          </div>
        </div>
        <Button><Plus className="mr-2 size-4" /> Add Budget</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Budgets" value={total} icon={<Wallet className="size-4" />} iconBg="bg-primary" caption="Budget entries" />
        <MetricCard title="Total Amount" value={formatCurrency(totalAmount)} icon={<DollarSign className="size-4" />} iconBg="bg-success" caption="Budget allocation" />
        <MetricCard title="Periods" value={uniquePeriods} icon={<Wallet className="size-4" />} iconBg="bg-warning" caption="Distinct periods" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget List</CardTitle>
          <CardDescription>{total} budgets</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading budgets...</div>
          ) : (
            <DataTable columns={columns} data={budgets} filterPlaceholder="Search budgets..." filterColumn="accountName" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
