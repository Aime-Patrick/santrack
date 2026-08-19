"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, AlertTriangle, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useRecalls } from "@/hooks/recall";
import type { RecallBatch } from "@/services/recall.service";

const columns: ColumnDef<TableFeatures, RecallBatch>[] = [
  {
    accessorKey: "batchNumber",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Batch
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-danger text-white">
          <AlertTriangle className="size-4" />
        </div>
        <span className="font-mono text-sm">{row.original.batchNumber}</span>
      </div>
    ),
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => <span className="text-sm">{row.getValue("reason")}</span>,
  },
  {
    accessorKey: "affectedUnits",
    header: "Units",
    cell: ({ row }) => <Badge variant="destructive">{row.getValue("affectedUnits")}</Badge>,
  },
  {
    accessorKey: "initiatedBy",
    header: "Initiated By",
    cell: ({ row }) => <span className="text-sm">{row.getValue("initiatedBy")}</span>,
  },
  {
    accessorKey: "recallDate",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm">{new Date(row.getValue("recallDate") as string).toLocaleDateString()}</span>,
  },
  {
    id: "locations",
    header: "Impact",
    cell: ({ row }) => {
      const locs = row.original.impactedLocations?.length ?? 0;
      return (
        <div className="flex items-center gap-1.5 text-sm">
          <MapPin className="size-3.5 text-muted-foreground" />
          {locs} location{locs !== 1 && "s"}
        </div>
      );
    },
  },
];

export default function RecallPage() {
  const { data, isLoading } = useRecalls();
  const recalls = data ?? [];
  const total = recalls.length;
  const totalUnits = recalls.reduce((sum, r) => sum + (r.affectedUnits ?? 0), 0);
  const totalLocations = recalls.reduce((sum, r) => sum + (r.impactedLocations?.length ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-danger text-white">
          <AlertTriangle className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Product Recall</h1>
          <p className="text-sm text-muted-foreground">Manage product recalls and track affected units across locations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Active Recalls" value={total} icon={<AlertTriangle className="size-4" />} iconBg="bg-danger" caption="Recalled batches" />
        <MetricCard title="Units Affected" value={totalUnits} icon={<Trash2 className="size-4" />} iconBg="bg-danger" caption="Across all recalls" />
        <MetricCard title="Locations Impacted" value={totalLocations} icon={<MapPin className="size-4" />} iconBg="bg-warning-foreground" caption="Distribution points" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recall History</CardTitle>
          <CardDescription>{total} recall events</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading recalls...</div>
          ) : (
            <DataTable columns={columns} data={recalls} filterPlaceholder="Search recalls..." filterColumn="batchNumber" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
