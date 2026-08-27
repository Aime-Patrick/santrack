"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  Check,
  ChevronsUpDown,
  CornerDownRight,
  LoaderCircle,
  Pencil,
  QrCode,
  Tags,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import {
  useCategoryDetail,
  useProductCategories,
  useWithdrawCategory,
} from "@/hooks/products";
import { useCapabilities } from "@/hooks/permissions";
import { CategoryShareDialog } from "@/components/products/category-share-dialog";
import { CategoryDialog } from "@/components/products/category-dialogs";
import type { ProductCategory } from "@/services/product.service";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";

type ProductRow = {
  id: number;
  name: string;
  sku: string;
  brand: string | null;
  gtin: string | null;
  batchCount: number;
  unitCount: number;
  unitsByStatus: Record<string, number>;
};

/** Solid fills so status reads clearly on the category detail page. */
const UNIT_STATUS_COLORS: Record<string, string> = {
  GENERATED: "border-transparent bg-muted-foreground text-white",
  ASSIGNED: "border-transparent bg-info text-white",
  ACTIVE: "border-transparent bg-success text-white",
  RESERVED: "border-transparent bg-primary text-white",
  IN_TRANSIT: "border-transparent bg-warning text-warning-foreground",
  SOLD: "border-transparent bg-primary text-white",
  RETURNED: "border-transparent bg-warning text-warning-foreground",
  QUARANTINED: "border-transparent bg-warning text-warning-foreground",
  RECALLED: "border-transparent bg-danger text-white",
  EXPIRED: "border-transparent bg-danger text-white",
  DAMAGED: "border-transparent bg-danger text-white",
  DESTROYED: "border-transparent bg-danger text-white",
};

const BATCH_STATUS_COLORS: Record<string, string> = {
  PENDING_QC: "border-transparent bg-warning text-warning-foreground",
  APPROVED: "border-transparent bg-success text-white",
  ACTIVE: "border-transparent bg-success text-white",
  REJECTED: "border-transparent bg-danger text-white",
  REWORK: "border-transparent bg-warning text-warning-foreground",
  QUARANTINED: "border-transparent bg-warning text-warning-foreground",
  RECALLED: "border-transparent bg-danger text-white",
  CLOSED: "border-transparent bg-muted-foreground text-white",
};

const FALLBACK_STATUS = "border-transparent bg-muted-foreground text-white";

function statusBadge(status: string, count: number, palette: Record<string, string>) {
  return (
    <Badge
      key={status}
      variant="outline"
      className={cn("font-semibold", palette[status] ?? FALLBACK_STATUS)}
    >
      {status.replace(/_/g, " ")} · {count}
    </Badge>
  );
}

/** Depth-first tree order so the switcher mirrors taxonomy nesting. */
function flattenCategoryTree(
  categories: ProductCategory[],
): { category: ProductCategory; depth: number }[] {
  const byParent = new Map<number | null, ProductCategory[]>();
  for (const category of categories) {
    const list = byParent.get(category.parentId) ?? [];
    list.push(category);
    byParent.set(category.parentId, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  const out: { category: ProductCategory; depth: number }[] = [];
  const seen = new Set<number>();

  function walk(parentId: number | null, depth: number) {
    for (const category of byParent.get(parentId) ?? []) {
      if (seen.has(category.id)) continue;
      seen.add(category.id);
      out.push({ category, depth });
      walk(category.id, depth + 1);
    }
  }

  walk(null, 0);
  for (const category of categories) {
    if (!seen.has(category.id)) {
      out.push({ category, depth: 0 });
    }
  }
  return out;
}

function CategorySwitcher({
  currentId,
  currentName,
}: {
  currentId: number;
  currentName: string;
}) {
  const { data: categories = [] } = useProductCategories();
  const options = useMemo(
    () => flattenCategoryTree(categories),
    [categories],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "group inline-flex max-w-full items-center gap-1.5 rounded-md text-left",
          "text-xl font-bold tracking-tight outline-none",
          "hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/40",
          "px-1.5 py-0.5 -mx-1.5",
        )}
      >
        <span className="truncate">{currentName}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-56 max-w-80 w-auto"
      >
        <DropdownMenuLabel>Switch category</DropdownMenuLabel>
        {options.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">
            No categories yet
          </p>
        ) : (
          options.map(({ category, depth }) => {
            const selected = category.id === currentId;
            return (
              <DropdownMenuItem
                key={category.id}
                className={cn(
                  "gap-2",
                  selected && "bg-accent/60",
                  !category.active && "text-muted-foreground",
                )}
                style={{ paddingLeft: 6 + depth * 12 }}
                render={
                  <Link href={`/dashboard/products/categories/${category.id}`} />
                }
              >
                <Check
                  className={cn(
                    "size-3.5 shrink-0",
                    selected ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{category.name}</span>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {category.code}
                </span>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function CategoryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data, isLoading, isError, error, refetch } = useCategoryDetail(
    Number.isFinite(id) ? id : null,
  );
  const permissions = useCapabilities();
  const mayEdit = permissions.can("MANAGE_CATALOG");
  const withdraw = useWithdrawCategory();
  const [sharing, setSharing] = useState(false);
  const [editing, setEditing] = useState(false);

  const productColumns = useMemo(
    (): ColumnDef<TableFeatures, ProductRow>[] => [
      {
        accessorKey: "name",
        header: "Product",
        cell: ({ row }) => (
          <div>
            <Link
              href={`/dashboard/products/${row.original.id}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              {row.original.name}
            </Link>
            <p className="font-mono text-xs text-muted-foreground">
              {row.original.sku}
              {row.original.brand ? ` · ${row.original.brand}` : ""}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "batchCount",
        header: "Lots",
        cell: ({ row }) => (
          <Link
            href={`/dashboard/products/${row.original.id}?tab=batches`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {row.original.batchCount}
          </Link>
        ),
      },
      {
        accessorKey: "unitCount",
        header: "Units",
        cell: ({ row }) => (
          <Link
            href={`/dashboard/products/${row.original.id}?tab=identities`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {row.original.unitCount}
          </Link>
        ),
      },
      {
        id: "lifecycle",
        header: "Unit status",
        cell: ({ row }) => {
          const entries = Object.entries(row.original.unitsByStatus);
          if (entries.length === 0) {
            return <span className="text-xs text-faint">No identities yet</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {entries
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([status, count]) => (
                  <Badge
                    key={status}
                    variant="outline"
                    className={cn(
                      "text-[10px] font-semibold",
                      UNIT_STATUS_COLORS[status] ?? FALLBACK_STATUS,
                    )}
                  >
                    {status.replace(/_/g, " ")} {count}
                  </Badge>
                ))}
            </div>
          );
        },
      },
    ],
    [],
  );

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-sm text-muted-foreground">Invalid category link.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-sm text-destructive">
          {getApiErrorMessage(error, "Could not load this category")}
        </p>
      </div>
    );
  }

  const statusEntries = Object.entries(data.summary.unitsByStatus).sort(
    (a, b) => b[1] - a[1],
  );
  const batchStatusEntries = Object.entries(data.summary.batchesByStatus).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <BackLink />
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
              <Tags className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CategorySwitcher
                  currentId={data.id}
                  currentName={data.name}
                />
                <Badge
                  variant="outline"
                  className={cn(
                    data.active
                      ? "border-success bg-success text-white"
                      : "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {data.active ? "Active" : "Withdrawn"}
                </Badge>
              </div>
              <p className="font-mono text-sm text-muted-foreground">{data.code}</p>
              {data.parent ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <CornerDownRight className="size-3" />
                  under{" "}
                  <Link
                    href={`/dashboard/products/categories/${data.parent.id}`}
                    className="text-primary hover:underline"
                  >
                    {data.parent.name}
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setSharing(true)}>
            <QrCode className="mr-1.5 size-3.5" />
            Share QR
          </Button>
          {mayEdit ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="mr-1.5 size-3.5" />
                Edit
              </Button>
              {data.active ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-danger hover:bg-danger/10 hover:text-danger"
                  disabled={withdraw.isPending}
                  onClick={() =>
                    withdraw.mutate(data.id, { onSuccess: () => void refetch() })
                  }
                >
                  <Archive className="mr-1.5 size-3.5" />
                  Withdraw
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {(statusEntries.length > 0 || batchStatusEntries.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Unit lifecycle</CardTitle>
              <CardDescription>
                Current status of identities under products in this category
                {data.summary.unitCount > 0
                  ? ` · ${data.summary.unitCount} total`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {statusEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No units yet</p>
              ) : (
                statusEntries.map(([status, count]) =>
                  statusBadge(status, count, UNIT_STATUS_COLORS),
                )
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Lot status</CardTitle>
              <CardDescription>
                Production lots linked to these products
                {data.summary.batchCount > 0
                  ? ` · ${data.summary.batchCount} total`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {batchStatusEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No lots yet</p>
              ) : (
                batchStatusEntries.map(([status, count]) =>
                  statusBadge(status, count, BATCH_STATUS_COLORS),
                )
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {data.children.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Subcategories</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.children.map((child) => (
              <Link
                key={child.id}
                href={`/dashboard/products/categories/${child.id}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  child.active
                    ? "border-success bg-success text-white hover:bg-success/90 hover:text-white"
                    : "border-border bg-muted text-muted-foreground opacity-70",
                )}
              >
                {child.name}
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your products</CardTitle>
          <CardDescription>
            {data.summary.productCount} catalogue{" "}
            {data.summary.productCount === 1 ? "entry" : "entries"} filed under{" "}
            {data.name}. Open a product for batches, identities, and labels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.products.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No products in this category yet.{" "}
              <Link href="/dashboard/products/new" className="text-primary hover:underline">
                Add a product
              </Link>
            </p>
          ) : (
            <DataTable
              columns={productColumns}
              data={data.products}
              filterColumn="name"
              filterPlaceholder="Search products..."
              pageSize={10}
              noBorder
            />
          )}
        </CardContent>
      </Card>

      <CategoryShareDialog
        category={data}
        open={sharing}
        initialShareUrl={data.share.url}
        onOpenChange={setSharing}
      />
      <CategoryDialog
        open={editing}
        onOpenChange={setEditing}
        category={data}
        onSaved={() => void refetch()}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/products/categories"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" />
      Categories
    </Link>
  );
}
