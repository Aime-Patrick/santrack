"use client";

import { useState } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  Package,
  QrCode,
  Tag,
  Layers,
  Barcode,
  ExternalLink,
  ChevronRight,
  Tags,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useProducts } from "@/hooks/products";
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
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2"
      >
        Product Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const product = row.original;
      return (
        <Link
          href={`/dashboard/products/${product.id}`}
          className="group flex items-center gap-2.5 hover:opacity-90"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-xs group-hover:bg-primary/90 transition-colors">
            <Package className="size-4" />
          </div>
          <div>
            <p className="font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
              {row.getValue("name")}
              <ChevronRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
            </p>
            <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>
          </div>
        </Link>
      );
    },
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => (
      <Link
        href={`/dashboard/products/${row.original.id}`}
        className="font-mono text-xs text-muted-foreground hover:text-primary"
      >
        {row.getValue("sku")}
      </Link>
    ),
  },
  {
    id: "category",
    header: "Category",
    accessorFn: (row: any) => row.categoryName || row.category || "—",
    cell: ({ row }) => {
      const cat = (row.getValue("category") as string) || "—";
      const color =
        categoryColors[cat] ?? "border-border bg-muted/60 text-muted-foreground";
      return (
        <Badge variant="outline" className={color}>
          {cat}
        </Badge>
      );
    },
  },
  {
    accessorKey: "brand",
    header: "Brand",
    cell: ({ row }) => row.getValue("brand") || "—",
  },
  {
    accessorKey: "specification",
    header: "Specification",
    cell: ({ row }) => {
      const spec = row.getValue("specification") as string | null;
      return spec ? (
        <span className="line-clamp-1 max-w-[180px] text-xs text-muted-foreground">
          {spec}
        </span>
      ) : (
        "—"
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="h-8 w-8 p-0" />}
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">Product Actions</DropdownMenuLabel>
            <DropdownMenuItem
              render={<Link href={`/dashboard/products/${product.id}`} />}
            >
              <ExternalLink className="mr-2 size-4 text-primary" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<Link href={`/dashboard/products/${product.id}?tab=identities`} />}
            >
              <QrCode className="mr-2 size-4 text-primary" />
              Identities & Pools
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<Link href={`/dashboard/products/${product.id}?tab=batches`} />}
            >
              <Layers className="mr-2 size-4 text-success" />
              Batches
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<Link href={`/dashboard/products/${product.id}?tab=labels`} />}
            >
              <Barcode className="mr-2 size-4 text-warning-foreground" />
              Labels & Codes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function ProductsPage() {
  const { data, isLoading } = useProducts(0, 200);
  const [search, setSearch] = useState("");

  const products = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const filtered = search
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku?.toLowerCase().includes(search.toLowerCase()) ||
          p.brand?.toLowerCase().includes(search.toLowerCase()) ||
          p.gtin?.toLowerCase().includes(search.toLowerCase()),
      )
    : products;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Package className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Products</h1>
            <p className="text-sm text-muted-foreground">
              Manage your product catalog. Select a product to prepare code pools, manage batches, or download labels.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/dashboard/products/categories" />}
          >
            <Tags className="mr-1.5 size-4" />
            Categories & Brands
          </Button>
          <Button size="sm" render={<Link href="/dashboard/products/new" />}>
            <Plus className="mr-1.5 size-4" />
            Add Product
          </Button>
        </div>
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
          title="With Barcodes / SKU"
          value={products.filter((p) => p.sku).length}
          icon={<QrCode className="size-4" />}
          iconBg="bg-warning-foreground"
          caption="Ready for traceability"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Product Catalog</CardTitle>
            <CardDescription>{filtered.length} products found</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by name, SKU, brand, or GTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Loading products...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              pageSize={10}
              noBorder
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

