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
import { useOrganizations } from "@/hooks/organizations";

type Industry = {
  id: string;
  name: string;
  category: string;
  type: string;
  status: "active" | "pending" | "inactive";
};

const TYPE_LABELS: Record<string, string> = {
  MANUFACTURER: "Manufacturing",
  WAREHOUSE: "Warehousing",
  DISTRIBUTOR: "Distribution",
  RETAILER: "Retail",
  SHOP: "Shop",
  REGULATOR: "Regulator",
  CONSUMER: "Consumer",
};

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
  {
    id: "status",
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
  const { data: orgs, isLoading } = useOrganizations();

  const industries: Industry[] =
    orgs?.map((org) => ({
      id: `ORG-${String(org.id).padStart(3, "0")}`,
      name: org.name,
      category: TYPE_LABELS[org.type] ?? org.type,
      type: org.type,
      status: "active" as const,
    })) ?? [];

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
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-muted" />
                    <div className="space-y-1">
                      <div className="h-3 w-32 rounded bg-muted" />
                      <div className="h-2 w-16 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="h-3 w-20 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <DataTable columns={columns} data={industries} filterColumn="name" filterPlaceholder="Search industries..." pageSize={5} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
