"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, MapPin, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useLocations } from "@/hooks/locations";
import type { Location } from "@/services/location.service";

const typeColors: Record<string, string> = {
  FACTORY: "border-primary/30 bg-primary/10 text-primary",
  WAREHOUSE: "border-success/30 bg-success/10 text-success",
  DISTRIBUTION_CENTER: "border-warning/30 bg-warning/10 text-warning-foreground",
  STORE: "border-danger/30 bg-danger/10 text-danger",
  SHOP: "border-primary/30 bg-primary/10 text-primary",
  VEHICLE: "border-muted bg-muted/60 text-muted-foreground",
};

const columns: ColumnDef<TableFeatures, Location>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <MapPin className="size-4" />
        </div>
        <span className="text-sm font-medium">{row.getValue("name")}</span>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return <Badge variant="outline" className={typeColors[type] ?? "border-border bg-muted/60 text-muted-foreground"}>{type}</Badge>;
    },
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => {
      const addr = row.getValue("address") as string | null;
      return addr ? <span className="text-sm text-muted-foreground">{addr}</span> : <span className="text-faint">—</span>;
    },
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => {
      const active = row.getValue("active") as boolean;
      return active ? <CheckCircle className="size-4 text-success" /> : <XCircle className="size-4 text-muted-foreground" />;
    },
  },
];

export default function LocationsPage() {
  const { data, isLoading } = useLocations();
  const locations = data ?? [];
  const total = locations.length;
  const activeCount = locations.filter((l) => l.active).length;
  const warehouseCount = locations.filter((l) => l.type === "WAREHOUSE" || l.type === "DISTRIBUTION_CENTER").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <MapPin className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Locations</h1>
            <p className="text-sm text-muted-foreground">Manage physical locations across your organization.</p>
          </div>
        </div>
        <Button><Plus className="mr-2 size-4" /> Add Location</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Locations" value={total} icon={<MapPin className="size-4" />} iconBg="bg-primary" caption="All locations" />
        <MetricCard title="Active" value={activeCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="Active locations" />
        <MetricCard title="Warehouses" value={warehouseCount} icon={<MapPin className="size-4" />} iconBg="bg-warning" caption="Storage facilities" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Location List</CardTitle>
          <CardDescription>{total} locations</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading locations...</div>
          ) : (
            <DataTable columns={columns} data={locations} filterPlaceholder="Search locations..." filterColumn="name" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
