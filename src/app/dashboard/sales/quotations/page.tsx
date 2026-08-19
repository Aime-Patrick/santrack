"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, FileText, Send, CheckCircle, XCircle, Clock, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useQuotations, useSendQuotation, useAcceptQuotation, useRejectQuotation, useExpireQuotation } from "@/hooks/commerce";
import type { Quotation } from "@/services/commerce.service";

const statusColors: Record<string, string> = {
  DRAFT: "border-border bg-muted/60 text-muted-foreground",
  SENT: "border-primary/30 bg-primary/10 text-primary",
  ACCEPTED: "border-success/30 bg-success/10 text-success",
  REJECTED: "border-danger/30 bg-danger/10 text-danger",
  EXPIRED: "border-warning/30 bg-warning/10 text-warning-foreground",
};

export default function QuotationsPage() {
  const { data, isLoading } = useQuotations();
  const sendQuotation = useSendQuotation();
  const acceptQuotation = useAcceptQuotation();
  const rejectQuotation = useRejectQuotation();
  const expireQuotation = useExpireQuotation();
  const quotations = data?.content ?? [];
  const total = data?.total ?? 0;
  const draftCount = quotations.filter((q) => q.status === "DRAFT").length;
  const sentCount = quotations.filter((q) => q.status === "SENT").length;
  const acceptedCount = quotations.filter((q) => q.status === "ACCEPTED").length;

  const columns: ColumnDef<TableFeatures, Quotation>[] = [
    {
      accessorKey: "quotationNumber",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
          Quote #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <FileText className="size-4" />
          </div>
          <span className="font-mono text-sm">{row.getValue("quotationNumber")}</span>
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
      accessorKey: "validUntilOn",
      header: "Valid Until",
      cell: ({ row }) => {
        const d = new Date(row.getValue("validUntilOn") as string);
        return <span className="text-sm">{d.toLocaleDateString()}</span>;
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
      cell: ({ row }) => {
        const d = new Date(row.getValue("createdAt") as string);
        return <span className="text-sm">{d.toLocaleDateString()}</span>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const quote = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-8 p-0" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {quote.status === "DRAFT" && (
                <DropdownMenuItem onClick={() => sendQuotation.mutate(quote.id)}>
                  <Send className="mr-2 size-4" /> Send
                </DropdownMenuItem>
              )}
              {quote.status === "SENT" && (
                <>
                  <DropdownMenuItem onClick={() => acceptQuotation.mutate(quote.id)}>
                    <CheckCircle className="mr-2 size-4" /> Accept
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => rejectQuotation.mutate({ id: quote.id, data: { reason: "Rejected" } })} className="text-destructive">
                    <XCircle className="mr-2 size-4" /> Reject
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => expireQuotation.mutate(quote.id)}>
                    <Clock className="mr-2 size-4" /> Expire
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <FileText className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Quotations</h1>
          <p className="text-sm text-muted-foreground">Create and manage price quotations for customers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard title="Total Quotes" value={total} icon={<FileText className="size-4" />} iconBg="bg-primary" caption="All quotations" />
        <MetricCard title="Drafts" value={draftCount} icon={<Clock className="size-4" />} iconBg="bg-muted text-muted-foreground" caption="Not yet sent" />
        <MetricCard title="Sent" value={sentCount} icon={<Send className="size-4" />} iconBg="bg-primary" caption="Awaiting response" />
        <MetricCard title="Accepted" value={acceptedCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="Converted to orders" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quotation List</CardTitle>
          <CardDescription>{total} quotations</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading quotations...</div>
          ) : (
            <DataTable columns={columns} data={quotations} filterPlaceholder="Search quotations..." filterColumn="quotationNumber" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
