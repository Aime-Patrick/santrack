"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, Droplets, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useRawMaterials, useCreateRawMaterial } from "@/hooks/manufacturing";
import {
  ResourceFormDialog,
  num,
  type SelectOption,
} from "@/components/ui/resource-form-dialog";
import type { RawMaterial } from "@/services/manufacturing.service";

/**
 * The units a material can be counted in.
 *
 * A fixed list rather than a free-text box: a bill of materials multiplies a
 * quantity by this, and "kg" alongside "Kg" alongside "kilos" is three
 * materials the system cannot reconcile.
 */
const UNITS: SelectOption[] = [
  { value: "KG", label: "Kilogram", hint: "kg" },
  { value: "G", label: "Gram", hint: "g" },
  { value: "TONNE", label: "Tonne", hint: "t" },
  { value: "L", label: "Litre", hint: "L" },
  { value: "ML", label: "Millilitre", hint: "mL" },
  { value: "M", label: "Metre", hint: "m" },
  { value: "M2", label: "Square metre", hint: "m²" },
  { value: "M3", label: "Cubic metre", hint: "m³" },
  { value: "PIECE", label: "Piece", hint: "ea" },
  { value: "BOX", label: "Box" },
  { value: "ROLL", label: "Roll" },
  { value: "SHEET", label: "Sheet" },
];

const columns: ColumnDef<TableFeatures, RawMaterial>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Material Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <Droplets className="size-4" />
        </div>
        <div>
          <p className="font-medium">{row.getValue("name")}</p>
          <p className="font-mono text-xs text-faint">{row.original.code}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("category") || "—"}</Badge>,
  },
  {
    accessorKey: "unitOfMeasure",
    header: "Unit",
    cell: ({ row }) => <span className="text-sm">{row.getValue("unitOfMeasure")}</span>,
  },
  {
    accessorKey: "unitCost",
    header: "Unit Cost",
    cell: ({ row }) => <span className="text-sm font-medium">{(row.getValue("unitCost") as number).toLocaleString()} RWF</span>,
  },
  {
    accessorKey: "reorderLevel",
    header: "Reorder Level",
    cell: ({ row }) => <span className="text-sm">{row.getValue("reorderLevel")}</span>,
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => {
      const active = row.getValue("active") as boolean;
      return (
        <Badge variant="outline" className={active ? "border-success/30 bg-success/10 text-success" : "border-border bg-muted/60 text-muted-foreground"}>
          {active ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
];

export default function RawMaterialsPage() {
  const { data, isLoading } = useRawMaterials();
  const [creating, setCreating] = useState(false);
  const create = useCreateRawMaterial();

  const materials = data ?? [];
  const total = materials.length;
  const categories = new Set(materials.map((m) => m.category).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Droplets className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Raw Materials</h1>
            <p className="text-sm text-muted-foreground">Manage raw materials catalog and stock levels.</p>
          </div>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 size-4" /> Add Material
        </Button>
      </div>

      <ResourceFormDialog
        open={creating}
        onOpenChange={setCreating}
        title="Add a raw material"
        description="What goes into production. Bills of material draw on this catalogue, so the unit of measure here is the one every recipe will be written in."
        submitLabel="Add material"
        pending={create.isPending}
        fields={[
          {
            name: "name",
            label: "Name",
            kind: "text",
            required: true,
            placeholder: "e.g. Food-grade PET resin",
          },
          {
            name: "code",
            label: "Code",
            kind: "text",
            required: true,
            half: true,
            mono: true,
            uppercase: true,
            placeholder: "RM-PET-001",
            hint: "Your own reference for it.",
          },
          {
            name: "category",
            label: "Category",
            kind: "text",
            required: true,
            half: true,
            placeholder: "Packaging",
          },
          {
            name: "unitOfMeasure",
            label: "Unit of measure",
            kind: "select",
            required: true,
            half: true,
            options: UNITS,
            hint: "How this is counted, everywhere.",
          },
          {
            name: "unitCost",
            label: "Unit cost",
            kind: "number",
            required: true,
            half: true,
            min: 0,
            step: 0.01,
            suffix: "RWF",
          },
          {
            name: "reorderLevel",
            label: "Reorder level",
            kind: "number",
            half: true,
            min: 0,
            hint: "Stock at or below this raises a low-stock alert.",
          },
        ]}
        onSubmit={(v) =>
          create.mutate(
            {
              name: v.name.trim(),
              code: v.code.trim(),
              category: v.category.trim(),
              unitOfMeasure: v.unitOfMeasure,
              unitCost: num(v, "unitCost") ?? 0,
              reorderLevel: num(v, "reorderLevel"),
            },
            { onSuccess: () => setCreating(false) },
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Materials" value={total} icon={<Droplets className="size-4" />} iconBg="bg-primary" caption="Registered materials" />
        <MetricCard title="Categories" value={categories} icon={<Package className="size-4" />} iconBg="bg-success" caption="Material categories" />
        <MetricCard title="Active" value={materials.filter((m) => m.active).length} icon={<Droplets className="size-4" />} iconBg="bg-success" caption="Currently active" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Materials Catalog</CardTitle>
          <CardDescription>{total} materials</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading materials...</div>
          ) : (
            <DataTable columns={columns} data={materials} filterPlaceholder="Search materials..." filterColumn="name" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
