"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, User, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useDrivers, useCreateDriver, useTransporters } from "@/hooks/logistics";
import { ResourceFormDialog } from "@/components/ui/resource-form-dialog";
import type { Driver } from "@/services/logistics.service";

const columns: ColumnDef<TableFeatures, Driver>[] = [
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
          <User className="size-4" />
        </div>
        <span className="text-sm font-medium">{row.getValue("name")}</span>
      </div>
    ),
  },
  {
    accessorKey: "licenseNumber",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        License
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("licenseNumber")}</span>,
  },
  {
    accessorKey: "transporterName",
    header: "Transporter",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("transporterName")}</Badge>,
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("phone")}</span>,
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

export function DriversPanel() {
  const { data, isLoading } = useDrivers();
  const { data: transporters } = useTransporters();
  const [creating, setCreating] = useState(false);
  const create = useCreateDriver();
  const drivers = data?.content ?? [];
  const total = data?.total ?? 0;
  const activeCount = drivers.filter((d) => d.active).length;
  const inactiveCount = total - activeCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <User className="size-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Drivers</h2>
            <p className="text-sm text-muted-foreground">Manage driver assignments and licenses.</p>
          </div>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 size-4" /> Add Driver
        </Button>
      </div>

      <ResourceFormDialog
        open={creating}
        onOpenChange={setCreating}
        title="Add a driver"
        description="A driver works for a transporter. Naming them makes proof of delivery attributable to a person rather than to a plate number."
        submitLabel="Add driver"
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
            hint: "Drivers belong to a haulage company, not to you.",
          },
          {
            name: "name",
            label: "Full name",
            kind: "text",
            required: true,
            half: true,
            placeholder: "e.g. Jean Uwimana",
          },
          {
            name: "phone",
            label: "Phone",
            kind: "text",
            required: true,
            half: true,
            placeholder: "+250 7…",
          },
          {
            name: "licenseNumber",
            label: "Licence number",
            kind: "text",
            required: true,
            mono: true,
            uppercase: true,
          },
        ]}
        onSubmit={(v) =>
          create.mutate(
            {
              transporterId: Number(v.transporterId),
              name: v.name.trim(),
              phone: v.phone.trim(),
              licenseNumber: v.licenseNumber.trim(),
            },
            { onSuccess: () => setCreating(false) },
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Drivers" value={total} icon={<User className="size-4" />} iconBg="bg-primary" caption="Registered drivers" />
        <MetricCard title="Active" value={activeCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="Currently active" />
        <MetricCard title="Inactive" value={inactiveCount} icon={<XCircle className="size-4" />} iconBg="bg-danger" caption="Disabled" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Driver Registry</CardTitle>
          <CardDescription>{total} drivers</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading drivers...</div>
          ) : (
            <DataTable columns={columns} data={drivers} filterPlaceholder="Search drivers..." filterColumn="name" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
