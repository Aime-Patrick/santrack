"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, RotateCcw, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useReturns } from "@/hooks/commerce";
import type { SalesReturn } from "@/services/commerce.service";

const statusColors: Record<string, string> = {
  PENDING: "border-warning/30 bg-warning/10 text-warning-foreground",
  APPROVED: "border-success/30 bg-success/10 text-success",
  REJECTED: "border-danger/30 bg-danger/10 text-danger",
  REFUNDED: "border-primary/30 bg-primary/10 text-primary",
};

const columns: ColumnDef<TableFeatures, SalesReturn>[] = [
  {
    accessorKey: "returnNumber",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Return #
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning-foreground text-white">
          <RotateCcw className="size-4" />
        </div>
        <span className="font-mono text-sm">{row.getValue("returnNumber")}</span>
      </div>
    ),
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("customerName")}</span>,
  },
  {
    accessorKey: "invoiceNumber",
    header: "Invoice",
    cell: ({ row }) => {
      const num = row.getValue("invoiceNumber") as string | null;
      return num ? <span className="font-mono text-sm text-faint">{num}</span> : "—";
    },
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
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">{row.getValue("reason")}</span>,
  },
  {
    accessorKey: "refundAmount",
    header: "Refund",
    cell: ({ row }) => {
      const amount = row.getValue("refundAmount") as number | null;
      return amount ? <span className="text-sm font-medium">{amount.toLocaleString()} RWF</span> : "—";
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const d = new Date(row.getValue("createdAt") as string);
      return <span className="text-sm">{d.toLocaleDateString()}</span>;
    },
  },
];

export default function ReturnsPage() {
  const { data, isLoading } = useReturns();
  const returns = data?.content ?? [];
  const total = data?.total ?? 0;
  const pendingCount = returns.filter((r) => r.status === "PENDING").length;
  const approvedCount = returns.filter((r) => r.status === "APPROVED").length;
  const totalRefund = returns.reduce((sum, r) => sum + (r.refundAmount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-warning-foreground text-white">
          <RotateCcw className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Returns</h1>
          <p className="text-sm text-muted-foreground">Manage return requests, approvals, and refunds.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard title="Total Returns" value={total} icon={<RotateCcw className="size-4" />} iconBg="bg-warning-foreground" caption="All return requests" />
        <MetricCard title="Pending" value={pendingCount} icon={<Clock className="size-4" />} iconBg="bg-warning-foreground" caption="Awaiting review" />
        <MetricCard title="Approved" value={approvedCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="Approved for refund" />
        <MetricCard title="Total Refund" value={`${totalRefund.toLocaleString()} RWF`} icon={<XCircle className="size-4" />} iconBg="bg-danger" caption="Refunded amount" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Return Requests</CardTitle>
          <CardDescription>{total} returns</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading returns...</div>
          ) : (
            <DataTable columns={columns} data={returns} filterPlaceholder="Search returns..." filterColumn="returnNumber" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
