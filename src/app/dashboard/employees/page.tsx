"use client";

import Link from "next/link";
import { Plus, Users, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { TableFeatures } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Employee = {
  id: string;
  fullName: string;
  department: string;
  position: string;
  phone: string;
  email: string;
  employmentType: "full_time" | "part_time" | "contract";
  hireDate: string;
  status: "active" | "on_leave" | "terminated";
};

const employees: Employee[] = [
  { id: "EMP-001", fullName: "Pacifique Shema", department: "Management", position: "General Manager", phone: "+250 788 123 456", email: "p.shema@inyange.rw", employmentType: "full_time", hireDate: "2018-03-15", status: "active" },
  { id: "EMP-002", fullName: "Claudine Niyonzima", department: "Finance", position: "Finance Officer", phone: "+250 788 234 567", email: "c.niyonzima@inyange.rw", employmentType: "full_time", hireDate: "2019-07-22", status: "active" },
  { id: "EMP-003", fullName: "Jean Uwamahoro", department: "Production", position: "Production Supervisor", phone: "+250 788 345 678", email: "j.uwamahoro@inyange.rw", employmentType: "full_time", hireDate: "2020-01-10", status: "active" },
  { id: "EMP-004", fullName: "Mugisha Didier", department: "Maintenance", position: "Maintenance Lead", phone: "+250 788 456 789", email: "m.didier@inyange.rw", employmentType: "full_time", hireDate: "2021-05-08", status: "on_leave" },
  { id: "EMP-005", fullName: "Immaculée Bizimana", department: "Quality Control", position: "QC Analyst", phone: "+250 788 567 890", email: "i.bizimana@inyange.rw", employmentType: "full_time", hireDate: "2022-09-14", status: "active" },
  { id: "EMP-006", fullName: "Patrick Nshimiyimana", department: "Warehouse", position: "Warehouse Manager", phone: "+250 788 678 901", email: "p.nshimiyimana@inyange.rw", employmentType: "full_time", hireDate: "2019-11-20", status: "active" },
  { id: "EMP-007", fullName: "Diane Umutoni", department: "Sales", position: "Sales Officer", phone: "+250 788 789 012", email: "d.umutoni@inyange.rw", employmentType: "contract", hireDate: "2023-02-01", status: "active" },
  { id: "EMP-008", fullName: "Eric Habimana", department: "Logistics", position: "Driver", phone: "+250 788 890 123", email: "e.habimana@inyange.rw", employmentType: "part_time", hireDate: "2024-06-15", status: "terminated" },
];

function StatusBadge({ status }: { status: Employee["status"] }) {
  return (
    <Badge
      variant={status === "active" ? "default" : "secondary"}
      className={
        status === "active"
          ? "bg-success/10 text-success border-success/20"
          : status === "on_leave"
            ? "bg-warning/10 text-warning-foreground border-warning/20"
            : "bg-muted text-muted-foreground"
      }
    >
      {status === "active" ? "Active" : status === "on_leave" ? "On Leave" : "Terminated"}
    </Badge>
  );
}

function EmploymentTypeBadge({ type }: { type: Employee["employmentType"] }) {
  return (
    <Badge variant="outline" className="text-xs">
      {type === "full_time" ? "Full Time" : type === "part_time" ? "Part Time" : "Contract"}
    </Badge>
  );
}

const columns: ColumnDef<TableFeatures, Employee>[] = [
  {
    accessorKey: "fullName",
    header: "Employee",
    cell: ({ row }) => {
      const emp = row.original;
      const initials = emp.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2);
      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary text-white text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{emp.fullName}</div>
            <div className="text-xs text-muted-foreground">{emp.id}</div>
          </div>
        </div>
      );
    },
  },
  { accessorKey: "department", header: "Department" },
  { accessorKey: "position", header: "Position" },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.phone}</span>,
  },
  {
    accessorKey: "employmentType",
    header: "Type",
    cell: ({ row }) => <EmploymentTypeBadge type={row.original.employmentType} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    header: "",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-8 p-0" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem><Eye className="mr-2 size-4" /> View Profile</DropdownMenuItem>
          <DropdownMenuItem><Pencil className="mr-2 size-4" /> Edit</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 size-4" /> Deactivate</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-success text-white">
            <Users className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Employees</h1>
            <p className="text-sm text-muted-foreground">Manage staff members and their roles</p>
          </div>
        </div>
        <Link href="/dashboard/employees/new">
          <Button><Plus className="mr-2 size-4" /> Add Employee</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={employees} filterColumn="fullName" filterPlaceholder="Search employees..." pageSize={5} noBorder />
        </CardContent>
      </Card>
    </div>
  );
}
