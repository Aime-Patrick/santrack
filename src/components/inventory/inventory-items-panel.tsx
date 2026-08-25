"use client";

import Link from "next/link";
import { Plus, Package, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
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
import { useItems } from "@/hooks/items";

type InventoryItem = {
  id: string;
  name: string;
  code: string;
  kind: string;
  quantity: number;
  location: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
  rawStatus: string;
};

function mapStatus(qty: number, rawStatus: string): InventoryItem["status"] {
  if (rawStatus === "ACTIVE") return qty > 0 ? "in_stock" : "out_of_stock";
  if (rawStatus === "QUARANTINED" || rawStatus === "RECALLED") return "out_of_stock";
  if (qty <= 0) return "out_of_stock";
  return "in_stock";
}

function StatusBadge({ status }: { status: InventoryItem["status"] }) {
  return (
    <Badge
      variant={status === "in_stock" ? "default" : "secondary"}
      className={
        status === "in_stock"
          ? "bg-success/10 text-success border-success/20"
          : status === "low_stock"
            ? "bg-warning/10 text-warning-foreground border-warning/20"
            : "bg-danger/10 text-danger border-danger/20"
      }
    >
      {status === "in_stock" ? "In Stock" : status === "low_stock" ? "Low Stock" : "Out of Stock"}
    </Badge>
  );
}

const columns: ColumnDef<TableFeatures, InventoryItem>[] = [
  {
    accessorKey: "name",
    header: "Item",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary text-white text-xs">
              <Package className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{item.name}</div>
            <div className="text-xs text-muted-foreground font-mono">{item.code}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "kind",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {row.original.kind}
      </Badge>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Stock",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.quantity.toLocaleString()}</span>
    ),
  },
  { accessorKey: "location", header: "Location" },
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
          <DropdownMenuItem><Eye className="mr-2 size-4" /> View Details</DropdownMenuItem>
          <DropdownMenuItem><Pencil className="mr-2 size-4" /> Edit</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 size-4" /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function InventoryItemsPanel() {
  const { data: itemData, isLoading } = useItems({ size: 50 });

  const items: InventoryItem[] =
    itemData?.content?.map((item) => ({
      id: item.qrCode,
      name: item.productName ?? item.code,
      code: item.code,
      kind: item.kind,
      quantity: item.quantity,
      location: item.locationName ?? "—",
      status: mapStatus(item.quantity, item.status),
      rawStatus: item.status,
    })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-prose text-sm text-muted-foreground">
          Stock levels, costs and locations, item by item.
        </p>
        <Link href="/dashboard/inventory/new">
          <Button><Plus className="mr-2 size-4" /> Add Item</Button>
        </Link>
      </div>

      <Card>
        <CardContent>
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
            <DataTable columns={columns} data={items} filterColumn="name" filterPlaceholder="Search items..." pageSize={5} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
