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

type InventoryItem = {
  id: string;
  name: string;
  code: string;
  category: string;
  unitOfMeasure: string;
  currentStock: number;
  reorderLevel: number;
  unitCost: number;
  location: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
};

const items: InventoryItem[] = [
  { id: "INV-001", name: "Portland Cement", code: "CEM-001", category: "Raw Materials", unitOfMeasure: "Bags", currentStock: 2400, reorderLevel: 500, unitCost: 9500, location: "Warehouse A", status: "in_stock" },
  { id: "INV-002", name: "Steel Rebars 12mm", code: "STL-012", category: "Raw Materials", unitOfMeasure: "Tons", currentStock: 45, reorderLevel: 50, unitCost: 850000, location: "Warehouse B", status: "low_stock" },
  { id: "INV-003", name: "Packaging Boxes (Small)", code: "PKG-S01", category: "Packaging", unitOfMeasure: "Units", currentStock: 12000, reorderLevel: 2000, unitCost: 150, location: "Warehouse A", status: "in_stock" },
  { id: "INV-004", name: "PVC Pipes 4 inch", code: "PVC-004", category: "Finished Goods", unitOfMeasure: "Meters", currentStock: 0, reorderLevel: 100, unitCost: 3200, location: "Warehouse C", status: "out_of_stock" },
  { id: "INV-005", name: "Milk Powder", code: "MLK-001", category: "Raw Materials", unitOfMeasure: "Kg", currentStock: 850, reorderLevel: 200, unitCost: 4500, location: "Cold Store", status: "in_stock" },
  { id: "INV-006", name: "Sugar (Granulated)", code: "SGR-001", category: "Raw Materials", unitOfMeasure: "Kg", currentStock: 120, reorderLevel: 150, unitCost: 1200, location: "Warehouse A", status: "low_stock" },
  { id: "INV-007", name: "Tea Leaves (Green)", code: "TEA-001", category: "Raw Materials", unitOfMeasure: "Kg", currentStock: 3200, reorderLevel: 500, unitCost: 2800, location: "Warehouse D", status: "in_stock" },
  { id: "INV-008", name: "Paint (White Emulsion)", code: "PNT-W01", category: "Finished Goods", unitOfMeasure: "Liters", currentStock: 340, reorderLevel: 100, unitCost: 15000, location: "Warehouse B", status: "in_stock" },
];

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
            <div className="text-xs text-muted-foreground">{item.code}</div>
          </div>
        </div>
      );
    },
  },
  { accessorKey: "category", header: "Category" },
  {
    accessorKey: "currentStock",
    header: "Stock",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div>
          <span className="font-medium">{item.currentStock.toLocaleString()}</span>
          <span className="text-muted-foreground ml-1">{item.unitOfMeasure}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "reorderLevel",
    header: "Reorder Level",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.reorderLevel.toLocaleString()}</span>
    ),
  },
  {
    accessorKey: "unitCost",
    header: "Unit Cost",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.unitCost.toLocaleString()} RWF</span>
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

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Package className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Inventory Items</h1>
            <p className="text-sm text-muted-foreground">Track stock levels, costs, and locations</p>
          </div>
        </div>
        <Link href="/dashboard/inventory/new">
          <Button><Plus className="mr-2 size-4" /> Add Item</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={items} filterColumn="name" filterPlaceholder="Search items..." pageSize={5} noBorder />
        </CardContent>
      </Card>
    </div>
  );
}
