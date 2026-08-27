"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, BarChart3, TrendingUp, TrendingDown, Scale, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useFinanceReports } from "@/hooks/finance";
import type { TrialBalanceLine, BalanceSheetReport, ReceivableLine } from "@/services/finance.service";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount);
}

const trialBalanceColumns: ColumnDef<TableFeatures, TrialBalanceLine>[] = [
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
          <BarChart3 className="size-4" />
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
    accessorKey: "debit",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Debit
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const val = row.getValue("debit") as number;
      return <span className="text-sm font-medium">{val > 0 ? formatCurrency(val) : "—"}</span>;
    },
  },
  {
    accessorKey: "credit",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Credit
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const val = row.getValue("credit") as number;
      return <span className="text-sm font-medium">{val > 0 ? formatCurrency(val) : "—"}</span>;
    },
  },
];

const receivableColumns: ColumnDef<TableFeatures, ReceivableLine>[] = [
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
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning text-white">
          <AlertCircle className="size-4" />
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
    accessorKey: "balance",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Balance
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm font-medium">{formatCurrency(row.getValue("balance"))}</span>,
  },
];

export default function ReportsPage() {
  const { trialBalance, balanceSheet, receivables } = useFinanceReports();
  const tbLines = trialBalance.data ?? [];
  const bsData = balanceSheet.data;
  const recLines = receivables.data ?? [];
  const tbTotal = tbLines.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <BarChart3 className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Finance Reports</h1>
            <p className="text-sm text-muted-foreground">Trial balance, balance sheet, and receivables.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Trial Balance" value={tbTotal} icon={<BarChart3 className="size-4" />} iconBg="bg-primary" caption="Account lines" />
        <MetricCard
          title="Total Assets"
          value={bsData ? formatCurrency(bsData.totalAssets) : "—"}
          icon={<TrendingUp className="size-4" />}
          iconBg="bg-success"
          caption="Balance sheet"
        />
        <MetricCard
          title="Total Liabilities"
          value={bsData ? formatCurrency(bsData.totalLiabilities) : "—"}
          icon={<TrendingDown className="size-4" />}
          iconBg="bg-danger"
          caption="Balance sheet"
        />
        <MetricCard
          title="Receivables"
          value={recLines.length}
          icon={<Scale className="size-4" />}
          iconBg="bg-warning"
          caption="Receivable accounts"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Trial Balance</CardTitle>
              <CardDescription>Debits and credits overview</CardDescription>
            </div>
            <Badge variant="outline" className="border-transparent bg-primary text-white">
              {tbTotal} accounts
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {trialBalance.isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading trial balance...</div>
          ) : (
            <DataTable columns={trialBalanceColumns} data={tbLines} filterPlaceholder="Search accounts..." filterColumn="accountName" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Receivables</CardTitle>
              <CardDescription>Outstanding receivable balances</CardDescription>
            </div>
            <Badge variant="outline" className="border-transparent bg-warning-foreground text-white">
              {recLines.length} accounts
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {receivables.isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading receivables...</div>
          ) : (
            <DataTable columns={receivableColumns} data={recLines} filterPlaceholder="Search accounts..." filterColumn="accountName" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
