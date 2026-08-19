"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, PlayCircle, DollarSign, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { usePayrollRuns } from "@/hooks/payroll";
import type { PayrollRun } from "@/services/payroll.service";

const statusColors: Record<string, string> = {
  DRAFT: "border-warning/30 bg-warning/10 text-warning-foreground",
  PROCESSED: "border-primary/30 bg-primary/10 text-primary",
  PAID: "border-success/30 bg-success/10 text-success",
  CANCELLED: "border-danger/30 bg-danger/10 text-danger",
};

const columns: ColumnDef<TableFeatures, PayrollRun>[] = [
  {
    accessorKey: "runNumber",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Run #
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm font-mono text-faint">{row.getValue("runNumber")}</span>,
  },
  {
    accessorKey: "period",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Period
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("period")}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant="outline" className={statusColors[status] ?? "border-border bg-muted/60 text-muted-foreground"}>{status}</Badge>;
    },
  },
  {
    accessorKey: "lines",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Employees
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const run = row.original;
      return <span className="text-sm">{run.lines.length}</span>;
    },
  },
  {
    id: "totalNet",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Total Net
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    accessorFn: (row) => row.lines.reduce((sum, l) => sum + l.net, 0),
    cell: ({ row }) => {
      const val = row.getValue("totalNet") as number;
      return <span className="text-sm font-mono">{val.toLocaleString()} RWF</span>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Created
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{new Date(row.getValue("createdAt") as string).toLocaleDateString()}</span>,
  },
];

export default function PayrollRunsPage() {
  const { data, isLoading } = usePayrollRuns();
  const runs = data ?? [];
  const total = runs.length;
  const totalNet = runs.reduce((sum, r) => sum + r.lines.reduce((s, l) => s + l.net, 0), 0);
  const paidCount = runs.filter((r) => r.status === "PAID").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <PlayCircle className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Payroll Runs</h1>
          <p className="text-sm text-muted-foreground">Track and manage payroll processing cycles.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Runs" value={total} icon={<PlayCircle className="size-4" />} iconBg="bg-primary" caption="Payroll cycles" />
        <MetricCard title="Total Net" value={`${totalNet.toLocaleString()} RWF`} icon={<DollarSign className="size-4" />} iconBg="bg-success" caption="All runs" />
        <MetricCard title="Paid" value={paidCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="Completed" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Runs</CardTitle>
          <CardDescription>{total} runs</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading payroll runs...</div>
          ) : (
            <DataTable columns={columns} data={runs} filterPlaceholder="Search runs..." filterColumn="period" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
