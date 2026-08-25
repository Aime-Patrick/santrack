"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, Cog, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useMachines, useCreateMachine } from "@/hooks/machines";
import { ResourceFormDialog, str } from "@/components/ui/resource-form-dialog";
import type { Machine } from "@/services/machine.service";

const statusColors: Record<string, string> = {
  ACTIVE: "border-success/30 bg-success/10 text-success",
  IDLE: "border-warning/30 bg-warning/10 text-warning-foreground",
  MAINTENANCE: "border-danger/30 bg-danger/10 text-danger",
  DECOMMISSIONED: "border-border bg-muted/60 text-muted-foreground",
};

const columns: ColumnDef<TableFeatures, Machine>[] = [
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
    cell: ({ row }) => <Badge variant="outline">{row.getValue("type")}</Badge>,
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
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Registered
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const d = new Date(row.getValue("createdAt") as string);
      return <span className="text-sm">{d.toLocaleDateString()}</span>;
    },
  },
];

export default function MachinesPage() {
  const { data, isLoading } = useMachines();
  const [creating, setCreating] = useState(false);
  const create = useCreateMachine();
  const machines = data ?? [];
  const total = machines.length;
  const activeCount = machines.filter((m) => m.status === "ACTIVE").length;
  const maintenanceCount = machines.filter((m) => m.status === "MAINTENANCE").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Cog className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Machines</h1>
            <p className="text-sm text-muted-foreground">Register and monitor production equipment.</p>
          </div>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 size-4" /> Register Machine
        </Button>
      </div>

      <ResourceFormDialog
        open={creating}
        onOpenChange={setCreating}
        title="Register a machine"
        description="Production orders are run against a machine, so the timeline can say which line made a batch."
        submitLabel="Register machine"
        pending={create.isPending}
        fields={[
          {
            name: "name",
            label: "Name",
            kind: "text",
            required: true,
            placeholder: "e.g. Blow moulder 2",
          },
          {
            name: "code",
            label: "Asset code",
            kind: "text",
            half: true,
            mono: true,
            uppercase: true,
            placeholder: "MCH-002",
            hint: "Left blank, one is generated.",
          },
          {
            name: "type",
            label: "Type",
            kind: "text",
            half: true,
            placeholder: "Blow moulding",
          },
        ]}
        onSubmit={(v) =>
          create.mutate(
            {
              name: v.name.trim(),
              code: str(v, "code"),
              type: str(v, "type"),
            },
            { onSuccess: () => setCreating(false) },
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Machines" value={total} icon={<Cog className="size-4" />} iconBg="bg-primary" caption="Registered equipment" />
        <MetricCard title="Active" value={activeCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="Operational" />
        <MetricCard title="Maintenance" value={maintenanceCount} icon={<XCircle className="size-4" />} iconBg="bg-danger" caption="Under service" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Machine Registry</CardTitle>
          <CardDescription>{total} machines</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading machines...</div>
          ) : (
            <DataTable columns={columns} data={machines} filterPlaceholder="Search machines..." filterColumn="name" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
