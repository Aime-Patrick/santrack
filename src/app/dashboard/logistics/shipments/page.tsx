"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, Truck, MapPin, Clock, CheckCircle, XCircle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useShipments, useDispatchShipment, useDeliverShipment, useCancelShipment } from "@/hooks/logistics";
import type { Shipment } from "@/services/logistics.service";

const statusColors: Record<string, string> = {
  PENDING: "border-border bg-muted/60 text-muted-foreground",
  DISPATCHED: "border-primary/30 bg-primary/10 text-primary",
  IN_TRANSIT: "border-warning/30 bg-warning/10 text-warning-foreground",
  DELIVERED: "border-success/30 bg-success/10 text-success",
};

export default function ShipmentsPage() {
  const { data, isLoading } = useShipments();
  const dispatchShipment = useDispatchShipment();
  const deliverShipment = useDeliverShipment();
  const cancelShipment = useCancelShipment();
  const shipments = data?.content ?? [];
  const total = data?.total ?? 0;
  const dispatchedCount = shipments.filter((s) => s.status === "DISPATCHED" || s.status === "IN_TRANSIT").length;
  const deliveredCount = shipments.filter((s) => s.status === "DELIVERED").length;

  const columns: ColumnDef<TableFeatures, Shipment>[] = [
    {
      accessorKey: "shipmentNumber",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
          Shipment #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <Truck className="size-4" />
          </div>
          <span className="font-mono text-sm">{row.getValue("shipmentNumber")}</span>
        </div>
      ),
    },
    {
      accessorKey: "origin",
      header: "Origin",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm">
          <MapPin className="size-3.5 text-muted-foreground" />
          {row.getValue("origin")}
        </div>
      ),
    },
    {
      accessorKey: "destination",
      header: "Destination",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm">
          <MapPin className="size-3.5 text-success" />
          {row.getValue("destination")}
        </div>
      ),
    },
    {
      accessorKey: "vehiclePlate",
      header: "Vehicle",
      cell: ({ row }) => {
        const plate = row.getValue("vehiclePlate") as string | null;
        return plate ? <span className="font-mono text-sm text-faint">{plate}</span> : "—";
      },
    },
    {
      accessorKey: "transporterName",
      header: "Transporter",
      cell: ({ row }) => <span className="text-sm">{(row.getValue("transporterName") as string) || "—"}</span>,
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
        const shipment = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-8 p-0" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {shipment.status === "PENDING" && (
                <>
                  <DropdownMenuItem onClick={() => dispatchShipment.mutate(shipment.id)}>
                    <Truck className="mr-2 size-4" /> Dispatch
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => cancelShipment.mutate(shipment.id)} className="text-destructive">
                    <XCircle className="mr-2 size-4" /> Cancel
                  </DropdownMenuItem>
                </>
              )}
              {(shipment.status === "DISPATCHED" || shipment.status === "IN_TRANSIT") && (
                <>
                  <DropdownMenuItem onClick={() => deliverShipment.mutate(shipment.id)}>
                    <CheckCircle className="mr-2 size-4" /> Mark Delivered
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => cancelShipment.mutate(shipment.id)} className="text-destructive">
                    <XCircle className="mr-2 size-4" /> Cancel
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Truck className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Shipments</h1>
            <p className="text-sm text-muted-foreground">Track and manage logistics shipments.</p>
          </div>
        </div>
        <Button><Plus className="mr-2 size-4" /> Create Shipment</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Shipments" value={total} icon={<Truck className="size-4" />} iconBg="bg-primary" caption="All shipments" />
        <MetricCard title="In Transit" value={dispatchedCount} icon={<Clock className="size-4" />} iconBg="bg-warning-foreground" caption="Active shipments" />
        <MetricCard title="Delivered" value={deliveredCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="Completed" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shipment Log</CardTitle>
          <CardDescription>{total} shipments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading shipments...</div>
          ) : (
            <DataTable columns={columns} data={shipments} filterPlaceholder="Search shipments..." filterColumn="shipmentNumber" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
