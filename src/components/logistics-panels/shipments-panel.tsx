"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, Truck, MapPin, Clock, CheckCircle, XCircle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useShipments, useDispatchShipment, useDeliverShipment, useCancelShipment, useCreateShipment, useVehicles, useTransporters } from "@/hooks/logistics";
import { ResourceFormDialog, num, str } from "@/components/ui/resource-form-dialog";
import { useOutgoingTransfers } from "@/hooks/transfers";
import type { Shipment } from "@/services/logistics.service";

const statusColors: Record<string, string> = {
  PENDING: "border-border bg-muted/60 text-muted-foreground",
  DISPATCHED: "border-primary/30 bg-primary/10 text-primary",
  IN_TRANSIT: "border-warning/30 bg-warning/10 text-warning-foreground",
  DELIVERED: "border-success/30 bg-success/10 text-success",
};

export function ShipmentsPanel() {
  const { data, isLoading } = useShipments();
  const { data: vehicles } = useVehicles();
  const { data: transporters } = useTransporters();
  const [creating, setCreating] = useState(false);
  const create = useCreateShipment();
  const { data: outgoing } = useOutgoingTransfers();

  /**
   * Dispatches that have left but are not yet confirmed received — the only
   * ones a shipment can carry. Offering anything else would produce a refusal
   * from the API with no explanation the operator could act on.
   */
  const awaitingShipment = (outgoing?.content ?? [])
    .filter((transfer) => transfer.status === "DISPATCHED")
    .map((transfer) => ({
      value: String(transfer.id),
      label: transfer.reference,
      hint: `→ ${transfer.destinationOrganizationName}`,
    }));
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
      // These three used to read `origin`, `destination` and `vehiclePlate` —
      // none of which the API returns, so all three columns rendered blank.
      accessorKey: "transferReference",
      header: "Carrying",
      cell: ({ row }) => {
        const reference = row.getValue("transferReference") as string | null;
        return reference ? (
          <span className="font-mono text-sm">{reference}</span>
        ) : (
          "—"
        );
      },
    },
    {
      accessorKey: "destinationOrganizationName",
      header: "Destination",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm">
          <MapPin className="size-3.5 text-success" />
          {(row.getValue("destinationOrganizationName") as string) || "—"}
        </div>
      ),
    },
    {
      accessorKey: "vehicleRegistration",
      header: "Vehicle",
      cell: ({ row }) => {
        const plate = row.getValue("vehicleRegistration") as string | null;
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
            <h2 className="text-lg font-semibold tracking-tight">Shipments</h2>
            <p className="text-sm text-muted-foreground">Track and manage logistics shipments.</p>
          </div>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 size-4" /> Create Shipment
        </Button>
      </div>

      <ResourceFormDialog
        open={creating}
        onOpenChange={setCreating}
        title="Create a shipment"
        description="A shipment carries a dispatch that has already left. Pick the transfer it is moving — its origin and destination come from that, so there is nothing to retype and nothing to get wrong."
        submitLabel="Create shipment"
        pending={create.isPending}
        fields={[
          {
            name: "transferId",
            label: "Transfer",
            kind: "select",
            required: true,
            options: awaitingShipment,
            emptyMessage: "No dispatched transfers are waiting",
            hint: "Dispatches you have sent that are not yet confirmed received.",
          },
          {
            name: "transporterId",
            label: "Transporter",
            kind: "select",
            required: true,
            options: (transporters?.content ?? []).map((t) => ({
              value: String(t.id),
              label: t.name,
              hint: t.code,
            })),
            emptyMessage: "Add a transporter first",
          },
          {
            name: "vehicleId",
            label: "Vehicle",
            kind: "select",
            half: true,
            options: (vehicles?.content ?? []).map((v) => ({
              value: String(v.id),
              label: v.registrationNumber,
              hint: v.type ?? undefined,
            })),
            emptyMessage: "None registered yet",
          },
          {
            name: "scheduledDepartureOn",
            label: "Scheduled departure",
            kind: "date",
            half: true,
            hint: "Leaving this blank is fine; departure is recorded when it happens.",
          },
        ]}
        onSubmit={(v) =>
          create.mutate(
            {
              transferId: Number(v.transferId),
              transporterId: Number(v.transporterId),
              vehicleId: num(v, "vehicleId"),
              scheduledDepartureOn: str(v, "scheduledDepartureOn"),
            },
            { onSuccess: () => setCreating(false) },
          )
        }
      />

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
