"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, Building2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useTransporters } from "@/hooks/logistics";
import type { Transporter } from "@/services/logistics.service";

const columns: ColumnDef<TableFeatures, Transporter>[] = [
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
          <Building2 className="size-4" />
        </div>
        <span className="text-sm font-medium">{row.getValue("name")}</span>
      </div>
    ),
  },
  {
    accessorKey: "code",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Code
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("code")}</span>,
  },
  {
    accessorKey: "contactPerson",
    header: "Contact Person",
    cell: ({ row }) => <span className="text-sm">{row.getValue("contactPerson")}</span>,
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("phone")}</span>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("email")}</span>,
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

export default function TransportersPage() {
  const { data, isLoading } = useTransporters();
  const transporters = data?.content ?? [];
  const total = data?.total ?? 0;
  const activeCount = transporters.filter((t) => t.active).length;
  const inactiveCount = total - activeCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Building2 className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Transporters</h1>
            <p className="text-sm text-muted-foreground">Manage transport companies and carriers.</p>
          </div>
        </div>
        <Button><Plus className="mr-2 size-4" /> Add Transporter</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Transporters" value={total} icon={<Building2 className="size-4" />} iconBg="bg-primary" caption="Registered carriers" />
        <MetricCard title="Active" value={activeCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="Currently active" />
        <MetricCard title="Inactive" value={inactiveCount} icon={<XCircle className="size-4" />} iconBg="bg-danger" caption="Disabled" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transporter Registry</CardTitle>
          <CardDescription>{total} transporters</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading transporters...</div>
          ) : (
            <DataTable columns={columns} data={transporters} filterPlaceholder="Search transporters..." filterColumn="name" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
