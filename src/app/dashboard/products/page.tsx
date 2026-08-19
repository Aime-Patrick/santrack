"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Plus, Package, QrCode, Layers, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useProducts, useDeleteProduct } from "@/hooks/products";
import type { Product } from "@/services/product.service";

const categoryColors: Record<string, string> = {
  AGRICULTURE: "border-success/30 bg-success/10 text-success",
  MINING: "border-warning/30 bg-warning/10 text-warning-foreground",
  MANUFACTURING: "border-primary/30 bg-primary/10 text-primary",
  FOOD: "border-success/30 bg-success/10 text-success",
  PHARMACEUTICAL: "border-info/30 bg-info/10 text-info",
};

const columns: ColumnDef<TableFeatures, Product>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Product Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <Package className="size-4" />
        </div>
        <div>
          <p className="font-medium">{row.getValue("name")}</p>
          <p className="font-mono text-xs text-faint">{row.original.sku}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const cat = (row.getValue("category") as string) || "—";
      const color = categoryColors[cat] ?? "border-border bg-muted/60 text-muted-foreground";
      return <Badge variant="outline" className={color}>{cat}</Badge>;
    },
  },
  { accessorKey: "brand", header: "Brand", cell: ({ row }) => row.getValue("brand") || "—" },
  { accessorKey: "model", header: "Model", cell: ({ row }) => row.getValue("model") || "—" },
  {
    accessorKey: "specification",
    header: "Specification",
    cell: ({ row }) => {
      const spec = row.getValue("specification") as string | null;
      return spec ? <span className="line-clamp-1 max-w-[200px] text-xs text-muted-foreground">{spec}</span> : "—";
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href={`/dashboard/products/${product.id}/qr`} />}>
              <QrCode className="mr-2 size-4" />
              Generate QR
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href={`/dashboard/products/${product.id}/batches/new`} />}>
              <Plus className="mr-2 size-4" />
              Create Batch
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function ProductsPage() {
  const { data, isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();

  const products = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Package className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Products</h1>
            <p className="text-sm text-muted-foreground">
              Manage your product catalog. Each product gets a SKU and can have batches and QR codes.
            </p>
          </div>
        </div>
        <Button render={<Link href="/dashboard/products/new" />}>
          <Plus className="mr-2 size-4" />
          Add Product
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Total Products"
          value={total}
          icon={<Package className="size-4" />}
          iconBg="bg-primary"
          caption="Registered in catalog"
        />
        <MetricCard
          title="Categories"
          value={new Set(products.map((p) => p.category).filter(Boolean)).size || "—"}
          icon={<Tag className="size-4" />}
          iconBg="bg-success"
          caption="Product categories"
        />
        <MetricCard
          title="With QR Codes"
          value={products.filter((p) => p.sku).length}
          icon={<QrCode className="size-4" />}
          iconBg="bg-warning-foreground"
          caption="Ready for traceability"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>{total} products registered</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Loading products...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={products}
              filterPlaceholder="Search products..."
              filterColumn="name"
              pageSize={10}
              noBorder
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
