"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, Building2, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useCustomers } from "@/hooks/commerce";
import type { Customer } from "@/services/commerce.service";

const columns: ColumnDef<TableFeatures, Customer>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Customer Name
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
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <Badge variant="outline" className={type === "BUSINESS" ? "border-primary/30 bg-primary/10 text-primary" : "border-success/30 bg-success/10 text-success"}>
          {type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "contactPerson",
    header: "Contact",
    cell: ({ row }) => <span className="text-sm">{row.getValue("contactPerson") || "—"}</span>,
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
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Mail className="size-3.5" />
        {row.getValue("email") || "—"}
      </div>
    ),
  },
  {
    accessorKey: "creditLimit",
    header: "Credit Limit",
    cell: ({ row }) => {
      const limit = row.getValue("creditLimit") as number | null;
      return limit ? <span className="text-sm font-medium">{limit.toLocaleString()} RWF</span> : "—";
    },
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

export default function CustomersPage() {
  const { data, isLoading } = useCustomers();
  const customers = data?.content ?? [];
  const total = data?.total ?? 0;
  const businessCount = customers.filter((c) => c.type === "BUSINESS").length;
  const consumerCount = customers.filter((c) => c.type === "CONSUMER").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Building2 className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Customers</h1>
            <p className="text-sm text-muted-foreground">Manage your customer directory and credit accounts.</p>
          </div>
        </div>
        <Button><Plus className="mr-2 size-4" /> Add Customer</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Customers" value={total} icon={<Building2 className="size-4" />} iconBg="bg-primary" caption="Registered buyers" />
        <MetricCard title="Business" value={businessCount} icon={<Building2 className="size-4" />} iconBg="bg-primary" caption="B2B accounts" />
        <MetricCard title="Consumers" value={consumerCount} icon={<Building2 className="size-4" />} iconBg="bg-success" caption="B2C accounts" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>{total} customers</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading customers...</div>
          ) : (
            <DataTable columns={columns} data={customers} filterPlaceholder="Search customers..." filterColumn="name" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
