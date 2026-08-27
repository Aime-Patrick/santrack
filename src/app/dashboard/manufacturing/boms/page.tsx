"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, Layers, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useBoms, useCreateBom } from "@/hooks/manufacturing";
import { BomFormDialog } from "@/components/manufacturing/bom-form-dialog";
import type { Bom } from "@/services/manufacturing.service";

const columns: ColumnDef<TableFeatures, Bom>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        BOM Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <Layers className="size-4" />
        </div>
        <div>
          <p className="font-medium">{row.getValue("name")}</p>
          <p className="text-xs text-muted-foreground">v{row.original.version}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "productName",
    header: "Product",
    cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("productName")}</span>,
  },
  {
    accessorKey: "version",
    header: "Version",
    cell: ({ row }) => <Badge variant="outline">v{row.getValue("version")}</Badge>,
  },
  {
    id: "materials",
    header: "Materials",
    cell: ({ row }) => {
      const lines = row.original.lines ?? [];
      return <span className="text-sm">{lines.length} material(s)</span>;
    },
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => {
      const active = row.getValue("active") as boolean;
      return (
        <Badge variant="outline" className={active ? "border-transparent bg-success text-white" : "border-border bg-muted/60 text-muted-foreground"}>
          {active ? "Active" : "Inactive"}
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
    cell: ({ row }) => {
      const d = new Date(row.getValue("createdAt") as string);
      return <span className="text-sm">{d.toLocaleDateString()}</span>;
    },
  },
];

export default function BomsPage() {
  const { data, isLoading } = useBoms();
  const [creating, setCreating] = useState(false);
  const create = useCreateBom();

  const boms = data ?? [];
  const total = boms.length;
  const activeCount = boms.filter((b) => b.active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Layers className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Bill of Materials</h1>
            <p className="text-sm text-muted-foreground">Define material requirements for production.</p>
          </div>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 size-4" /> Create BOM
        </Button>
      </div>

      <BomFormDialog
        open={creating}
        onOpenChange={setCreating}
        pending={create.isPending}
        onSubmit={(draft) =>
          create.mutate(draft, { onSuccess: () => setCreating(false) })
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total BOMs" value={total} icon={<Layers className="size-4" />} iconBg="bg-primary" caption="All BOMs" />
        <MetricCard title="Active" value={activeCount} icon={<Layers className="size-4" />} iconBg="bg-success" caption="Currently active" />
        <MetricCard title="Products Covered" value={new Set(boms.map((b) => b.productId)).size} icon={<Package className="size-4" />} iconBg="bg-primary" caption="With BOM definitions" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>BOM List</CardTitle>
          <CardDescription>{total} bills of material</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading BOMs...</div>
          ) : (
            <DataTable columns={columns} data={boms} filterPlaceholder="Search BOMs..." filterColumn="name" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
