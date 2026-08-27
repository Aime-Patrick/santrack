"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, Truck, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useVehicles, useCreateVehicle, useTransporters } from "@/hooks/logistics";
import { ResourceFormDialog, num, str } from "@/components/ui/resource-form-dialog";
import { VEHICLE_TYPES } from "@/lib/logistics-options";
import type { Vehicle } from "@/services/logistics.service";

const statusColors: Record<string, string> = {
  AVAILABLE: "border-transparent bg-success text-white",
  IN_TRANSIT: "border-transparent bg-primary text-white",
  MAINTENANCE: "border-transparent bg-danger text-white",
};

const columns: ColumnDef<TableFeatures, Vehicle>[] = [
  {
    accessorKey: "registrationNumber",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Registration
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <Truck className="size-4" />
        </div>
        <span className="font-mono text-sm">{row.getValue("registrationNumber")}</span>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("type")}</Badge>,
  },
  {
    accessorKey: "capacity",
    header: "Capacity",
    cell: ({ row }) => {
      const cap = row.getValue("capacity") as number | null;
      return cap ? <span className="text-sm">{cap} t</span> : "—";
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
    accessorKey: "active",
    header: "Active",
    cell: ({ row }) => {
      const active = row.getValue("active") as boolean;
      return active ? <CheckCircle className="size-4 text-success" /> : <XCircle className="size-4 text-muted-foreground" />;
    },
  },
];

export function VehiclesPanel() {
  const { data, isLoading } = useVehicles();
  const [creating, setCreating] = useState(false);
  const create = useCreateVehicle();
  const { data: transporters } = useTransporters();
  const vehicles = data?.content ?? [];
  const total = data?.total ?? 0;
  const availableCount = vehicles.filter((v) => v.status === "AVAILABLE").length;
  const inTransitCount = vehicles.filter((v) => v.status === "IN_TRANSIT").length;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 size-4" /> Register Vehicle
        </Button>
      </div>

      <ResourceFormDialog
        open={creating}
        onOpenChange={setCreating}
        title="Register a vehicle"
        description="Shipments are assigned to a vehicle, so the chain of custody records what the goods travelled in."
        submitLabel="Register vehicle"
        pending={create.isPending}
        fields={[
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
            hint: "A vehicle belongs to the haulage company that operates it.",
          },
          {
            name: "registrationNumber",
            label: "Registration number",
            kind: "text",
            required: true,
            half: true,
            mono: true,
            uppercase: true,
            placeholder: "RAD 123 A",
          },
          {
            name: "type",
            label: "Type",
            kind: "select",
            half: true,
            options: VEHICLE_TYPES,
          },
          {
            name: "capacity",
            label: "Capacity",
            kind: "number",
            min: 0,
            step: 0.1,
            suffix: "tonnes",
            hint: "Used to warn when a shipment is over-loaded.",
          },
        ]}
        onSubmit={(v) =>
          create.mutate(
            {
              transporterId: Number(v.transporterId),
              registrationNumber: v.registrationNumber.trim(),
              type: str(v, "type"),
              capacity: num(v, "capacity"),
            },
            { onSuccess: () => setCreating(false) },
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Vehicles" value={total} icon={<Truck className="size-4" />} iconBg="bg-primary" caption="Fleet size" />
        <MetricCard title="Available" value={availableCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="Ready for dispatch" />
        <MetricCard title="In Transit" value={inTransitCount} icon={<Truck className="size-4" />} iconBg="bg-primary" caption="Currently shipping" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fleet Registry</CardTitle>
          <CardDescription>{total} vehicles</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading vehicles...</div>
          ) : (
            <DataTable columns={columns} data={vehicles} filterPlaceholder="Search vehicles..." filterColumn="registrationNumber" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
