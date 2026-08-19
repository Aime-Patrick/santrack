"use client";

import Link from "next/link";
import { Plus, Building2, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
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

type Industry = {
  id: string;
  name: string;
  category: string;
  registrationNumber: string;
  location: string;
  status: "active" | "pending" | "inactive";
  employees: number;
  establishedDate: string;
};

const industries: Industry[] = [
  { id: "IND-001", name: "Inyange Milk Ltd", category: "Agro Processing", registrationNumber: "REG-2024-001", location: "Kigali", status: "active", employees: 342, establishedDate: "2015-03-12" },
  { id: "IND-002", name: "Bralirwa Brewery", category: "Manufacturing", registrationNumber: "REG-2024-002", location: "Rubavu", status: "active", employees: 1200, establishedDate: "2008-07-20" },
  { id: "IND-003", name: "Cimerwa Cement", category: "Mining & Quarrying", registrationNumber: "REG-2024-003", location: "Rusizi", status: "active", employees: 560, establishedDate: "2011-01-15" },
  { id: "IND-004", name: "Rwanda Steel Ltd", category: "Construction", registrationNumber: "REG-2024-004", location: "Kigali", status: "pending", employees: 180, establishedDate: "2020-09-05" },
  { id: "IND-005", name: "Akagera Foods", category: "Agro Processing", registrationNumber: "REG-2024-005", location: "Kayonza", status: "active", employees: 95, establishedDate: "2018-04-22" },
  { id: "IND-006", name: "Rwanda Mountain Tea", category: "Agro Processing", registrationNumber: "REG-2024-006", location: "Nyamasheke", status: "active", employees: 430, establishedDate: "2012-11-08" },
  { id: "IND-007", name: "Simba Cement", category: "Mining & Quarrying", registrationNumber: "REG-2024-007", location: "Musanze", status: "inactive", employees: 210, establishedDate: "2016-06-30" },
  { id: "IND-008", name: "Azam Industry", category: "Manufacturing", registrationNumber: "REG-2024-008", location: "Kigali", status: "active", employees: 670, establishedDate: "2014-02-18" },
];

function StatusBadge({ status }: { status: Industry["status"] }) {
  return (
    <Badge
      variant={status === "active" ? "default" : status === "pending" ? "secondary" : "outline"}
      className={
        status === "active"
          ? "bg-success/10 text-success border-success/20"
          : status === "pending"
            ? "bg-warning/10 text-warning-foreground border-warning/20"
            : "bg-muted text-muted-foreground"
      }
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

const columns: ColumnDef<TableFeatures, Industry>[] = [
  {
    accessorKey: "name",
    header: "Industry",
    cell: ({ row }) => {
      const industry = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-success text-white text-xs">
              {industry.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{industry.name}</div>
            <div className="text-xs text-muted-foreground">{industry.id}</div>
          </div>
        </div>
      );
    },
  },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "registrationNumber", header: "Reg. Number" },
  { accessorKey: "location", header: "Location" },
  {
    accessorKey: "employees",
    header: "Employees",
    cell: ({ row }) => row.original.employees.toLocaleString(),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const industry = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-8 p-0" />}>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem><Eye className="mr-2 size-4" /> View Details</DropdownMenuItem>
            <DropdownMenuItem><Pencil className="mr-2 size-4" /> Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 size-4" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function IndustriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-warning-foreground text-white">
            <Building2 className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Industries</h1>
            <p className="text-sm text-muted-foreground">Manage registered industries and their licenses</p>
          </div>
        </div>
        <Link href="/dashboard/industries/new">
          <Button><Plus className="mr-2 size-4" /> Add Industry</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={industries} filterColumn="name" filterPlaceholder="Search industries..." pageSize={5} noBorder />
        </CardContent>
      </Card>
    </div>
  );
}
