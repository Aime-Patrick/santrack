"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, Building2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useCostCentres } from "@/hooks/finance";
import type { CostCentre } from "@/services/finance.service";

const columns: ColumnDef<TableFeatures, CostCentre>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Code
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <Building2 className="size-4" />
        </div>
        <span className="font-mono text-sm">{row.getValue("code")}</span>
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("name")}</span>,
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => {
      const active = row.getValue("active") as boolean;
      return active ? (
        <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
          <CheckCircle className="mr-1 size-3" /> Active
        </Badge>
      ) : (
        <Badge variant="outline" className="border-muted bg-muted/60 text-muted-foreground">
          <XCircle className="mr-1 size-3" /> Inactive
        </Badge>
      );
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
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.getValue("createdAt")).toLocaleDateString()}
      </span>
    ),
  },
];

export default function CostCentresPage() {
  const { data, isLoading } = useCostCentres();
  const centres = data ?? [];
  const total = centres.length;
  const activeCount = centres.filter((c) => c.active).length;
  const inactiveCount = total - activeCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Building2 className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Cost Centres</h1>
            <p className="text-sm text-muted-foreground">Manage cost centres for departmental tracking.</p>
          </div>
        </div>
        <Button><Plus className="mr-2 size-4" /> Add Cost Centre</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Cost Centres" value={total} icon={<Building2 className="size-4" />} iconBg="bg-primary" caption="All cost centres" />
        <MetricCard title="Active" value={activeCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="Active cost centres" />
        <MetricCard title="Inactive" value={inactiveCount} icon={<XCircle className="size-4" />} iconBg="bg-danger" caption="Inactive cost centres" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost Centre List</CardTitle>
          <CardDescription>{total} cost centres</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading cost centres...</div>
          ) : (
            <DataTable columns={columns} data={centres} filterPlaceholder="Search cost centres..." filterColumn="name" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
