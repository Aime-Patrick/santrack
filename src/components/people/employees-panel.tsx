"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, Users, Building2, Mail, Phone, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useEmployees } from "@/hooks/payroll";
import type { Employee } from "@/services/payroll.service";

const statusColors: Record<string, string> = {
  ACTIVE: "border-success/30 bg-success/10 text-success",
  ON_LEAVE: "border-warning/30 bg-warning/10 text-warning-foreground",
  TERMINATED: "border-border bg-muted/60 text-muted-foreground",
};

const columns: ColumnDef<TableFeatures, Employee>[] = [
  {
    accessorKey: "fullName",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Employee
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const emp = row.original;
      const initials = emp.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2);
      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary text-white text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{emp.fullName}</div>
            <div className="font-mono text-xs text-faint">{emp.employeeNumber}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "departmentName",
    header: "Department",
    cell: ({ row }) => <span className="text-sm">{row.getValue("departmentName")}</span>,
  },
  {
    accessorKey: "jobPositionTitle",
    header: "Position",
    cell: ({ row }) => <span className="text-sm">{row.getValue("jobPositionTitle")}</span>,
  },
  {
    accessorKey: "employmentType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("employmentType") as string;
      return <Badge variant="outline">{type === "full_time" ? "Full Time" : type === "part_time" ? "Part Time" : "Contract"}</Badge>;
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Phone className="size-3.5" />
        {row.getValue("phone") || "—"}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant="outline" className={statusColors[status] ?? "border-border bg-muted/60 text-muted-foreground"}>{status}</Badge>;
    },
  },
];

export function EmployeesPanel() {
  const { data, isLoading } = useEmployees();
  const employees = data ?? [];
  const total = employees.length;
  const activeCount = employees.filter((e) => e.status === "ACTIVE").length;
  const departments = new Set(employees.map((e) => e.departmentName).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-success text-white">
            <Users className="size-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Employees</h2>
            <p className="text-sm text-muted-foreground">Manage staff members and their roles.</p>
          </div>
        </div>
        {/* A full employee form already exists at /employees/new — a second,
            smaller one here would collect less and disagree with it. */}
        <Button render={<Link href="/dashboard/employees/new" />}>
          <Plus className="mr-2 size-4" /> Add Employee
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Employees" value={total} icon={<Users className="size-4" />} iconBg="bg-primary" caption="Registered staff" />
        <MetricCard title="Active" value={activeCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="Currently active" />
        <MetricCard title="Departments" value={departments} icon={<Building2 className="size-4" />} iconBg="bg-warning-foreground" caption="Organizational units" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>{total} employees</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading employees...</div>
          ) : (
            <DataTable columns={columns} data={employees} filterPlaceholder="Search employees..." filterColumn="fullName" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
