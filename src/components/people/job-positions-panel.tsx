"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Briefcase, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useJobPositions } from "@/hooks/payroll";
import type { JobPosition } from "@/services/payroll.service";

const columns: ColumnDef<TableFeatures, JobPosition>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Code
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm font-mono text-faint">{row.getValue("code")}</span>,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm font-medium">{row.getValue("title")}</span>,
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => {
      const active = row.getValue("active") as boolean;
      return (
        <Badge
          variant="outline"
          className={active ? "border-transparent bg-success text-white" : "border-transparent bg-danger text-white"}
        >
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
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{new Date(row.getValue("createdAt") as string).toLocaleDateString()}</span>,
  },
];

export function JobPositionsPanel() {
  const { data, isLoading } = useJobPositions();
  const positions = data ?? [];
  const total = positions.length;
  const activeCount = positions.filter((p) => p.active).length;
  const inactiveCount = total - activeCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <Briefcase className="size-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Job Positions</h2>
          <p className="text-sm text-muted-foreground">Manage organizational roles and job titles.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Positions" value={total} icon={<Briefcase className="size-4" />} iconBg="bg-primary" caption="All roles" />
        <MetricCard title="Active" value={activeCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="Currently active" />
        <MetricCard title="Inactive" value={inactiveCount} icon={<XCircle className="size-4" />} iconBg="bg-danger" caption="Disabled" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Positions</CardTitle>
          <CardDescription>{total} positions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading positions...</div>
          ) : (
            <DataTable columns={columns} data={positions} filterPlaceholder="Search positions..." filterColumn="title" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
