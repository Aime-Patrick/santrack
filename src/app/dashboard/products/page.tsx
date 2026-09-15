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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useProducts } from "@/hooks/products";
import { useCapabilities } from "@/hooks/permissions";
import type { Product } from "@/services/product.service";

const columns: ColumnDef<TableFeatures, Product>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2"
      >
        Product
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
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-xs transition-colors group-hover:bg-primary/90">
            <Package className="size-4" />
          </div>
          <div>
            <p className="flex items-center gap-1 font-medium text-foreground transition-colors group-hover:text-primary">
              {row.getValue("name")}
              <ChevronRight className="size-3 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
            </p>
            <p className="font-mono text-xs text-muted-foreground">{product.sku || "No SKU"}</p>
          </div>
        </Link>
      );
    },
  },
  {
    id: "category",
    header: "Category",
    accessorFn: (row) => row.categoryName || row.categoryCode || row.category || "—",
    cell: ({ row }) => {
      const cat = (row.getValue("category") as string) || "—";
      return (
        <Badge
          variant="outline"
          className={
            cat === "—"
              ? "border-border bg-muted/60 text-muted-foreground"
              : "border-primary/20 bg-primary/10 text-primary"
          }
        >
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
    accessorKey: "gtin",
    header: "GTIN",
    cell: ({ row }) => {
      const gtin = row.getValue("gtin") as string | null;
      return gtin ? (
        <span className="font-mono text-xs">{gtin}</span>
      ) : (
        <span className="text-xs text-faint">—</span>
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
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs">Open</DropdownMenuLabel>
            <DropdownMenuItem
              nativeButton={false}
              render={<Link href={`/dashboard/products/${product.id}`} />}
            >
              <ExternalLink className="mr-2 size-4 text-primary" />
              Details
            </DropdownMenuItem>
            <DropdownMenuItem
              nativeButton={false}
              render={<Link href={`/dashboard/products/${product.id}?tab=identities`} />}
            >
              <QrCode className="mr-2 size-4 text-primary" />
              Code pools
            </DropdownMenuItem>
            <DropdownMenuItem
              nativeButton={false}
              render={<Link href={`/dashboard/products/${product.id}?tab=batches`} />}
            >
              <Layers className="mr-2 size-4 text-success" />
              Batches
            </DropdownMenuItem>
            <DropdownMenuItem
              nativeButton={false}
              render={<Link href={`/dashboard/products/${product.id}?tab=labels`} />}
            >
              <Barcode className="mr-2 size-4 text-warning-foreground" />
              Labels
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function ProductsPage() {
  const { data, isLoading } = useProducts(0, 200);
  const permissions = useCapabilities();
  const canManage = permissions.can("MANAGE_CATALOG");
  const [search, setSearch] = useState("");

  const products = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const filtered = search
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku?.toLowerCase().includes(search.toLowerCase()) ||
          p.brand?.toLowerCase().includes(search.toLowerCase()) ||
          p.gtin?.toLowerCase().includes(search.toLowerCase()) ||
          p.categoryName?.toLowerCase().includes(search.toLowerCase()),
      )
    : products;

  const categoryCount = new Set(
    products
      .map((p) => p.categoryId ?? p.categoryName ?? p.category)
      .filter(Boolean),
  ).size;
  const withGtin = products.filter((p) => p.gtin).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Package className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Products</h1>
            <p className="text-sm text-muted-foreground">
              Catalogue SKUs. Open a product to mint code pools, see lots, or print labels.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/products/categories" />}
          >
            <Tags className="mr-1.5 size-4" />
            Categories &amp; brands
          </Button>
          {canManage && (
            <Button size="sm" nativeButton={false} render={<Link href="/dashboard/products/new" />}>
              <Plus className="mr-1.5 size-4" />
              Add product
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Products"
          value={total}
          icon={<Package className="size-4" />}
          iconBg="bg-primary"
          caption="In this organisation"
        />
        <MetricCard
          title="Categories used"
          value={categoryCount || "—"}
          icon={<Tag className="size-4" />}
          iconBg="bg-success"
          caption="Filed in the catalogue"
          href="/dashboard/products/categories"
        />
        <MetricCard
          title="With GTIN"
          value={withGtin}
          icon={<QrCode className="size-4" />}
          iconBg="bg-warning text-foreground"
          caption="Ready for retail barcodes"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Catalogue</CardTitle>
            <CardDescription>
              {filtered.length} product{filtered.length === 1 ? "" : "s"}
              {search ? " matching search" : ""}
            </CardDescription>
          </div>
          <Input
            placeholder="Search name, SKU, brand, GTIN…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72"
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Loading products…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <Package className="size-8 text-border" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {search ? "No products match that search" : "No products yet"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {search
                    ? "Try another name, SKU, or brand."
                    : "Add a product, then mint QR pools before production."}
                </p>
              </div>
              {!search && canManage && (
                <Button size="sm" nativeButton={false} render={<Link href="/dashboard/products/new" />}>
                  <Plus className="mr-1.5 size-4" />
                  Add first product
                </Button>
              )}
            </div>
          ) : (
            <DataTable columns={columns} data={filtered} pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
