"use client";

import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, FileText, DollarSign, Clock, CheckCircle, MoreHorizontal, Send, Ban, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useInvoices, useIssueInvoice, useVoidInvoice, usePayInvoice } from "@/hooks/commerce";
import type { Invoice } from "@/services/commerce.service";

const statusColors: Record<string, string> = {
  DRAFT: "border-border bg-muted/60 text-muted-foreground",
  ISSUED: "border-primary/30 bg-primary/10 text-primary",
  PAID: "border-success/30 bg-success/10 text-success",
  VOIDED: "border-danger/30 bg-danger/10 text-danger",
  OVERDUE: "border-warning/30 bg-warning/10 text-warning-foreground",
};

export default function InvoicesPage() {
  const { data, isLoading } = useInvoices();
  const issueInvoice = useIssueInvoice();
  const voidInvoice = useVoidInvoice();
  const payInvoice = usePayInvoice();
  const invoices = data?.content ?? [];
  const total = data?.total ?? 0;
  const issuedCount = invoices.filter((i) => i.status === "ISSUED").length;
  const paidCount = invoices.filter((i) => i.status === "PAID").length;
  const totalRevenue = invoices.reduce((sum, i) => sum + (i.totalAmount ?? 0), 0);

  const columns: ColumnDef<TableFeatures, Invoice>[] = useMemo(() => [
    {
      accessorKey: "invoiceNumber",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
          Invoice #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <FileText className="size-4" />
          </div>
          <span className="font-mono text-sm">{row.getValue("invoiceNumber")}</span>
        </div>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("customerName")}</span>,
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
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = row.getValue("totalAmount") as number | null;
        return amount ? <span className="text-sm font-medium">{amount.toLocaleString()} RWF</span> : "—";
      },
    },
    {
      accessorKey: "amountPaid",
      header: "Paid",
      cell: ({ row }) => {
        const paid = row.getValue("amountPaid") as number;
        return <span className="text-sm">{paid.toLocaleString()} RWF</span>;
      },
    },
    {
      accessorKey: "dueOn",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
          Due Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const d = new Date(row.getValue("dueOn") as string);
        return <span className="text-sm">{d.toLocaleDateString()}</span>;
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-8 p-0" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {invoice.status === "DRAFT" && (
                <DropdownMenuItem onClick={() => issueInvoice.mutate(invoice.id)}>
                  <Send className="mr-2 size-4" /> Issue
                </DropdownMenuItem>
              )}
              {invoice.status === "ISSUED" && (
                <DropdownMenuItem onClick={() => payInvoice.mutate({ id: invoice.id, data: { amount: (invoice.totalAmount ?? 0) - invoice.amountPaid, method: "CASH" } })}>
                  <CreditCard className="mr-2 size-4" /> Record Payment
                </DropdownMenuItem>
              )}
              {invoice.status !== "VOID" && invoice.status !== "PAID" && (
                <DropdownMenuItem onClick={() => voidInvoice.mutate(invoice.id)} className="text-destructive">
                  <Ban className="mr-2 size-4" /> Void
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [issueInvoice, voidInvoice, payInvoice]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <FileText className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Invoices</h1>
            <p className="text-sm text-muted-foreground">Manage invoices, record payments, and track balances.</p>
          </div>
        </div>
        <Button><Plus className="mr-2 size-4" /> Create Invoice</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard title="Total Invoices" value={total} icon={<FileText className="size-4" />} iconBg="bg-primary" caption="All invoices" />
        <MetricCard title="Revenue" value={`${totalRevenue.toLocaleString()} RWF`} icon={<DollarSign className="size-4" />} iconBg="bg-success" caption="Total invoiced" />
        <MetricCard title="Outstanding" value={issuedCount} icon={<Clock className="size-4" />} iconBg="bg-warning-foreground" caption="Awaiting payment" />
        <MetricCard title="Paid" value={paidCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="Fully paid" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          <CardDescription>{total} invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading invoices...</div>
          ) : (
            <DataTable columns={columns} data={invoices} filterPlaceholder="Search invoices..." filterColumn="invoiceNumber" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
