"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, Truck, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useVehicles } from "@/hooks/logistics";
import type { Vehicle } from "@/services/logistics.service";

const statusColors: Record<string, string> = {
  AVAILABLE: "border-success/30 bg-success/10 text-success",
  IN_TRANSIT: "border-primary/30 bg-primary/10 text-primary",
  MAINTENANCE: "border-danger/30 bg-danger/10 text-danger",
};

const columns: ColumnDef<TableFeatures, Vehicle>[] = [
  {
    accessorKey: "plateNumber",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Plate Number
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <Truck className="size-4" />
        </div>
        <span className="font-mono text-sm">{row.getValue("plateNumber")}</span>
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
      return cap ? <span className="text-sm">{cap} kg</span> : "—";
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

export default function VehiclesPage() {
  const { data, isLoading } = useVehicles();
  const vehicles = data?.content ?? [];
  const total = data?.total ?? 0;
  const availableCount = vehicles.filter((v) => v.status === "AVAILABLE").length;
  const inTransitCount = vehicles.filter((v) => v.status === "IN_TRANSIT").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Truck className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Vehicles</h1>
            <p className="text-sm text-muted-foreground">Manage your fleet of transport vehicles.</p>
          </div>
        </div>
        <Button><Plus className="mr-2 size-4" /> Register Vehicle</Button>
      </div>

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
            <DataTable columns={columns} data={vehicles} filterPlaceholder="Search vehicles..." filterColumn="plateNumber" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
