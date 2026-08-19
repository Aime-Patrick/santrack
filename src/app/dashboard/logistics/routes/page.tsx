"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, MapPin, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useRoutes } from "@/hooks/logistics";
import type { Route } from "@/services/logistics.service";

const columns: ColumnDef<TableFeatures, Route>[] = [
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
    accessorKey: "sourceLocationName",
    header: "Source",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("sourceLocationName")}</Badge>,
  },
  {
    accessorKey: "destinationLocationName",
    header: "Destination",
    cell: ({ row }) => <Badge variant="outline" className="border-success/30 bg-success/10 text-success">{row.getValue("destinationLocationName")}</Badge>,
  },
  {
    accessorKey: "distanceKm",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Distance
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const dist = row.getValue("distanceKm") as number | null;
      return dist !== null ? <span className="font-mono text-sm">{dist} km</span> : "—";
    },
  },
  {
    accessorKey: "expectedHours",
    header: "Est. Hours",
    cell: ({ row }) => {
      const hrs = row.getValue("expectedHours") as number | null;
      return hrs !== null ? <span className="font-mono text-sm">{hrs}h</span> : "—";
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

export default function RoutesPage() {
  const { data, isLoading } = useRoutes();
  const routes = data?.content ?? [];
  const total = data?.total ?? 0;
  const activeCount = routes.filter((r) => r.active).length;
  const inactiveCount = total - activeCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <MapPin className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Routes</h1>
            <p className="text-sm text-muted-foreground">Manage shipping routes between locations.</p>
          </div>
        </div>
        <Button><Plus className="mr-2 size-4" /> Add Route</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Routes" value={total} icon={<MapPin className="size-4" />} iconBg="bg-primary" caption="Defined routes" />
        <MetricCard title="Active" value={activeCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="In use" />
        <MetricCard title="Inactive" value={inactiveCount} icon={<XCircle className="size-4" />} iconBg="bg-danger" caption="Disabled" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Route Registry</CardTitle>
          <CardDescription>{total} routes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading routes...</div>
          ) : (
            <DataTable columns={columns} data={routes} filterPlaceholder="Search routes..." filterColumn="name" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
