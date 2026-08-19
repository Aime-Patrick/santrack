"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, Factory, Play, CheckCircle, XCircle, Clock, MoreHorizontal, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useProductionOrders, useStartProduction, useCompleteProduction, useCancelProduction, useCloseProduction } from "@/hooks/manufacturing";
import type { ProductionOrder } from "@/services/manufacturing.service";

const statusColors: Record<string, string> = {
  PLANNED: "border-border bg-muted/60 text-muted-foreground",
  IN_PROGRESS: "border-primary/30 bg-primary/10 text-primary",
  COMPLETED: "border-success/30 bg-success/10 text-success",
  CANCELLED: "border-danger/30 bg-danger/10 text-danger",
};

export default function ProductionOrdersPage() {
  const { data, isLoading } = useProductionOrders();
  const startProduction = useStartProduction();
  const completeProduction = useCompleteProduction();
  const cancelProduction = useCancelProduction();
  const closeProduction = useCloseProduction();
  const orders = data?.content ?? [];

  const columns: ColumnDef<TableFeatures, ProductionOrder>[] = [
    {
      accessorKey: "orderNumber",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
          Order #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <Factory className="size-4" />
          </div>
          <span className="font-mono text-sm">{row.getValue("orderNumber")}</span>
        </div>
      ),
    },
    {
      accessorKey: "productName",
      header: "Product",
      cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("productName")}</span>,
    },
    {
      accessorKey: "plannedQuantity",
      header: "Planned",
      cell: ({ row }) => <span className="text-sm">{row.getValue("plannedQuantity")}</span>,
    },
    {
      accessorKey: "producedQuantity",
      header: "Produced",
      cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("producedQuantity")}</span>,
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
      accessorKey: "machineCode",
      header: "Machine",
      cell: ({ row }) => {
        const code = row.getValue("machineCode") as string | null;
        return code ? <span className="font-mono text-sm text-faint">{code}</span> : "—";
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
      header: "",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-8 p-0" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {order.status === "PLANNED" && (
                <>
                  <DropdownMenuItem onClick={() => startProduction.mutate(order.id)}>
                    <Play className="mr-2 size-4" /> Start
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => cancelProduction.mutate({ id: order.id, data: { reason: "Cancelled by admin" } })} className="text-danger">
                    <XCircle className="mr-2 size-4" /> Cancel
                  </DropdownMenuItem>
                </>
              )}
              {order.status === "IN_PROGRESS" && (
                <>
                  <DropdownMenuItem onClick={() => completeProduction.mutate({ id: order.id, data: { producedQuantity: order.producedQuantity } })}>
                    <CheckCircle className="mr-2 size-4" /> Complete
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => cancelProduction.mutate({ id: order.id, data: { reason: "Cancelled by admin" } })} className="text-danger">
                    <XCircle className="mr-2 size-4" /> Cancel
                  </DropdownMenuItem>
                </>
              )}
              {order.status === "COMPLETED" && (
                <DropdownMenuItem onClick={() => closeProduction.mutate(order.id)}>
                  <Archive className="mr-2 size-4" /> Close
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  const total = data?.total ?? 0;
  const plannedCount = orders.filter((o) => o.status === "PLANNED").length;
  const inProgressCount = orders.filter((o) => o.status === "IN_PROGRESS").length;
  const completedCount = orders.filter((o) => o.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Factory className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Production Orders</h1>
            <p className="text-sm text-muted-foreground">Create and manage production orders.</p>
          </div>
        </div>
        <Button><Plus className="mr-2 size-4" /> New Order</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard title="Total Orders" value={total} icon={<Factory className="size-4" />} iconBg="bg-primary" caption="All production orders" />
        <MetricCard title="Planned" value={plannedCount} icon={<Clock className="size-4" />} iconBg="bg-muted text-muted-foreground" caption="Not started" />
        <MetricCard title="In Progress" value={inProgressCount} icon={<Play className="size-4" />} iconBg="bg-primary" caption="Currently producing" />
        <MetricCard title="Completed" value={completedCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="Finished" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production Orders</CardTitle>
          <CardDescription>{total} orders</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading orders...</div>
          ) : (
            <DataTable columns={columns} data={orders} filterPlaceholder="Search orders..." filterColumn="orderNumber" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
