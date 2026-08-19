"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useDepartments } from "@/hooks/payroll";
import type { Department } from "@/services/payroll.service";

const columns: ColumnDef<TableFeatures, Department>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Department
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <Building2 className="size-4" />
        </div>
        <div>
          <p className="font-medium">{row.getValue("name")}</p>
          <p className="font-mono text-xs text-faint">{row.original.code}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "managerName",
    header: "Manager",
    cell: ({ row }) => <span className="text-sm">{(row.getValue("managerName") as string) || "—"}</span>,
  },
  {
    accessorKey: "employeeCount",
    header: "Employees",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm">
        <Users className="size-3.5 text-muted-foreground" />
        {row.getValue("employeeCount")}
      </div>
    ),
  },
];

export default function DepartmentsPage() {
  const { data, isLoading } = useDepartments();
  const departments = data ?? [];
  const total = departments.length;
  const totalEmployees = departments.reduce((sum, d) => sum + (d.employeeCount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Building2 className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Departments</h1>
            <p className="text-sm text-muted-foreground">Manage organizational departments.</p>
          </div>
        </div>
        <Button><Plus className="mr-2 size-4" /> Add Department</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricCard title="Total Departments" value={total} icon={<Building2 className="size-4" />} iconBg="bg-primary" caption="Organizational units" />
        <MetricCard title="Total Employees" value={totalEmployees} icon={<Users className="size-4" />} iconBg="bg-success" caption="Across all departments" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department List</CardTitle>
          <CardDescription>{total} departments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading departments...</div>
          ) : (
            <DataTable columns={columns} data={departments} filterPlaceholder="Search departments..." filterColumn="name" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
