"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Wrench,
  Cog,
  Droplets,
  Layers,
  Plus,
  CheckCircle,
  XCircle,
  Package,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import {
  ResourceFormDialog,
  num,
  str,
  type SelectOption,
} from "@/components/ui/resource-form-dialog";
import { BomFormDialog } from "@/components/manufacturing/bom-form-dialog";
import {
  useMachines,
  useCreateMachine,
} from "@/hooks/machines";
import {
  useRawMaterials,
  useCreateRawMaterial,
  useBoms,
  useCreateBom,
} from "@/hooks/manufacturing";
import type { Machine } from "@/services/machine.service";
import type { RawMaterial, Bom } from "@/services/manufacturing.service";

// ─────────────────────────────────────────────────────────────────────────────
// Units & Status colors
// ─────────────────────────────────────────────────────────────────────────────

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

const machineStatusColors: Record<string, string> = {
  ACTIVE: "border-transparent bg-success text-white",
  IDLE: "border-transparent bg-warning-foreground text-white",
  MAINTENANCE: "border-transparent bg-danger text-white",
  DECOMMISSIONED: "border-border bg-muted/60 text-muted-foreground",
};

// ─────────────────────────────────────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────────────────────────────────────

const machineColumns: ColumnDef<TableFeatures, Machine>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2"
      >
        Asset Code
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <Cog className="size-4" />
        </div>
        <span className="font-mono text-sm">{row.getValue("code")}</span>
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="font-medium text-sm">{row.getValue("name")}</span>,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("type") || "General"}</Badge>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant="outline"
          className={machineStatusColors[status] ?? "border-border bg-muted/60 text-muted-foreground"}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "active",
    header: "Active",
    cell: ({ row }) => {
      const active = row.getValue("active") as boolean;
      return active ? (
        <CheckCircle className="size-4 text-success" />
      ) : (
        <XCircle className="size-4 text-muted-foreground" />
      );
    },
  },
];

const materialColumns: ColumnDef<TableFeatures, RawMaterial>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2"
      >
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
          <p className="font-mono text-xs text-muted-foreground">{row.original.code}</p>
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
    cell: ({ row }) => <span className="text-sm font-mono">{row.getValue("unitOfMeasure")}</span>,
  },
  {
    accessorKey: "unitCost",
    header: "Unit Cost",
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {(row.getValue("unitCost") as number).toLocaleString()} RWF
      </span>
    ),
  },
  {
    accessorKey: "reorderLevel",
    header: "Reorder Level",
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("reorderLevel") ?? "—"}</span>
    ),
  },
];

const bomColumns: ColumnDef<TableFeatures, Bom>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2"
      >
        BOM Recipe
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
    header: "Lines",
    cell: ({ row }) => {
      const lines = row.original.lines ?? [];
      return <span className="text-sm">{lines.length} material item(s)</span>;
    },
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => {
      const active = row.getValue("active") as boolean;
      return (
        <Badge
          variant="outline"
          className={
            active
              ? "border-transparent bg-success text-white"
              : "border-border bg-muted/60 text-muted-foreground"
          }
        >
          {active ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Resources Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ManufacturingResourcesPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "machines";
  const [tab, setTab] = useState(initialTab);

  const { data: machines = [], isLoading: machinesLoading } = useMachines();
  const { data: materials = [], isLoading: materialsLoading } = useRawMaterials();
  const { data: boms = [], isLoading: bomsLoading } = useBoms();

  const [createMachineOpen, setCreateMachineOpen] = useState(false);
  const [createMaterialOpen, setCreateMaterialOpen] = useState(false);
  const [createBomOpen, setCreateBomOpen] = useState(false);

  const createMachine = useCreateMachine();
  const createMaterial = useCreateRawMaterial();
  const createBom = useCreateBom();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Wrench className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Manufacturing Resources</h1>
            <p className="text-sm text-muted-foreground">
              Equipment registry, raw materials catalog, and bills of materials recipes.
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Machines"
          value={machines.length}
          icon={<Cog className="size-4" />}
          iconBg="bg-primary"
          caption={`${machines.filter((m) => m.status === "ACTIVE").length} active on lines`}
        />
        <MetricCard
          title="Raw Materials"
          value={materials.length}
          icon={<Droplets className="size-4" />}
          iconBg="bg-success"
          caption={`${new Set(materials.map((m) => m.category).filter(Boolean)).size} categories`}
        />
        <MetricCard
          title="Bills of Materials"
          value={boms.length}
          icon={<Layers className="size-4" />}
          iconBg="bg-warning text-foreground"
          caption={`${boms.filter((b) => b.active).length} active recipes`}
        />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="rounded-xl border border-border/80 bg-muted/50 p-1">
          <TabsTrigger value="machines" className="gap-2">
            <Cog className="size-4" />
            Machines ({machines.length})
          </TabsTrigger>
          <TabsTrigger value="materials" className="gap-2">
            <Droplets className="size-4" />
            Raw Materials ({materials.length})
          </TabsTrigger>
          <TabsTrigger value="boms" className="gap-2">
            <Layers className="size-4" />
            Bills of Materials ({boms.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Machines ── */}
        <TabsContent value="machines">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Equipment Registry</CardTitle>
                <CardDescription>
                  Production machinery and line equipment mapped to orders.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setCreateMachineOpen(true)}>
                <Plus className="mr-1.5 size-4" />
                Register Machine
              </Button>
            </CardHeader>
            <CardContent>
              {machinesLoading ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" /> Loading machines…
                </div>
              ) : (
                <DataTable
                  columns={machineColumns}
                  data={machines}
                  filterPlaceholder="Search machines by name..."
                  filterColumn="name"
                  pageSize={10}
                  noBorder
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Raw Materials ── */}
        <TabsContent value="materials">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Raw Materials</CardTitle>
                <CardDescription>
                  Ingredients, packaging items, and supplies consumed in manufacturing.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setCreateMaterialOpen(true)}>
                <Plus className="mr-1.5 size-4" />
                Add Material
              </Button>
            </CardHeader>
            <CardContent>
              {materialsLoading ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" /> Loading materials…
                </div>
              ) : (
                <DataTable
                  columns={materialColumns}
                  data={materials}
                  filterPlaceholder="Search materials..."
                  filterColumn="name"
                  pageSize={10}
                  noBorder
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Bills of Materials ── */}
        <TabsContent value="boms">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Bills of Materials (BOM)</CardTitle>
                <CardDescription>
                  Production recipes that automatically allocate raw materials per unit produced.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setCreateBomOpen(true)}>
                <Plus className="mr-1.5 size-4" />
                Create BOM
              </Button>
            </CardHeader>
            <CardContent>
              {bomsLoading ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" /> Loading BOMs…
                </div>
              ) : (
                <DataTable
                  columns={bomColumns}
                  data={boms}
                  filterPlaceholder="Search BOM recipes..."
                  filterColumn="name"
                  pageSize={10}
                  noBorder
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Creation Dialogs */}
      <ResourceFormDialog
        open={createMachineOpen}
        onOpenChange={setCreateMachineOpen}
        title="Register a machine"
        description="Production orders run against a machine so the timeline shows which line made each lot."
        submitLabel="Register Machine"
        pending={createMachine.isPending}
        fields={[
          {
            name: "name",
            label: "Machine Name",
            kind: "text",
            required: true,
            placeholder: "e.g. Bottling Line 1",
          },
          {
            name: "code",
            label: "Asset Code",
            kind: "text",
            half: true,
            mono: true,
            uppercase: true,
            placeholder: "MCH-001",
            hint: "Left blank, one is generated.",
          },
          {
            name: "type",
            label: "Equipment Type",
            kind: "text",
            half: true,
            placeholder: "Filling & Capping",
          },
        ]}
        onSubmit={(v) =>
          createMachine.mutate(
            {
              name: v.name.trim(),
              code: str(v, "code"),
              type: str(v, "type"),
            },
            { onSuccess: () => setCreateMachineOpen(false) },
          )
        }
      />

      <ResourceFormDialog
        open={createMaterialOpen}
        onOpenChange={setCreateMaterialOpen}
        title="Add a raw material"
        description="Items consumed in production. Bills of materials draw on this catalog."
        submitLabel="Add Material"
        pending={createMaterial.isPending}
        fields={[
          {
            name: "name",
            label: "Material Name",
            kind: "text",
            required: true,
            placeholder: "e.g. Purified Spring Water",
          },
          {
            name: "code",
            label: "Code",
            kind: "text",
            required: true,
            half: true,
            mono: true,
            uppercase: true,
            placeholder: "RM-WAT-001",
          },
          {
            name: "category",
            label: "Category",
            kind: "text",
            required: true,
            half: true,
            placeholder: "Ingredients",
          },
          {
            name: "unitOfMeasure",
            label: "Unit of Measure",
            kind: "select",
            required: true,
            half: true,
            options: UNITS,
          },
          {
            name: "unitCost",
            label: "Unit Cost (RWF)",
            kind: "number",
            required: true,
            half: true,
            min: 0,
            step: 0.01,
          },
          {
            name: "reorderLevel",
            label: "Reorder Level",
            kind: "number",
            half: true,
            min: 0,
            hint: "Raises low stock alert.",
          },
        ]}
        onSubmit={(v) =>
          createMaterial.mutate(
            {
              name: v.name.trim(),
              code: v.code.trim(),
              category: v.category.trim(),
              unitOfMeasure: v.unitOfMeasure,
              unitCost: num(v, "unitCost") ?? 0,
              reorderLevel: num(v, "reorderLevel"),
            },
            { onSuccess: () => setCreateMaterialOpen(false) },
          )
        }
      />

      <BomFormDialog
        open={createBomOpen}
        onOpenChange={setCreateBomOpen}
        pending={createBom.isPending}
        onSubmit={(draft) =>
          createBom.mutate(draft, { onSuccess: () => setCreateBomOpen(false) })
        }
      />
    </div>
  );
}
