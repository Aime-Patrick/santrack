"use client";

import { useState } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useProductCategories,
  useWithdrawCategory,
  useBrands,
  useCreateBrand,
  useUpdateBrand,
  useWithdrawBrand,
} from "@/hooks/products";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deriveCode } from "@/lib/derive-code";
import { useCapabilities } from "@/hooks/permissions";
import type { Brand, ProductCategory } from "@/services/product.service";
import { cn } from "@/lib/utils";
import {
  Plus,
  Tags,
  LoaderCircle,
  Pencil,
  Archive,
  CornerDownRight,
  Bookmark,
  QrCode,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import { CategoryDialog } from "@/components/products/category-dialogs";
import { CategoryShareDialog } from "@/components/products/category-share-dialog";
import type { CategoryShareLink } from "@/services/product.service";

/**
 * The product taxonomy: what the platform counts as a kind of goods.
 *
 * Writes are held to MANAGE_CATALOG on the server — the capability that
 * creates products in the first place — so the buttons here are
 * hidden from anyone without it rather than failing when pressed.
 */
export default function ProductCategoriesPage() {
  const { data: categories, isLoading } = useProductCategories();
  const permissions = useCapabilities();
  const mayEdit = permissions.can("MANAGE_CATALOG");

  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState<ProductCategory | null>(null);
  const [createdShare, setCreatedShare] = useState<CategoryShareLink | null>(null);

  const withdrawMutation = useWithdrawCategory();

  const byId = new Map((categories ?? []).map((c) => [c.id, c]));

  const columns: ColumnDef<TableFeatures, ProductCategory>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Tags className="size-4 shrink-0 text-primary" />
          <Link
            href={`/dashboard/products/categories/${row.original.id}`}
            className="font-mono text-sm font-medium text-foreground hover:text-primary"
          >
            {row.getValue("code")}
          </Link>
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const parentId = row.original.parentId;
        const parent = parentId ? byId.get(parentId) : null;
        return (
          <div>
            <Link
              href={`/dashboard/products/categories/${row.original.id}`}
              className="text-sm text-foreground hover:text-primary"
            >
              {row.getValue("name")}
            </Link>
            {parent && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <CornerDownRight className="size-3" />
                under {parent.name}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "productCount",
      header: "Products",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("productCount")}
        </span>
      ),
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => {
        const active = row.getValue("active") as boolean;
        return (
          <Badge
            variant="outline"
            className={cn(
              active
                ? "border-success bg-success text-white"
                : "border-border bg-muted text-muted-foreground",
            )}
          >
            {active ? "Active" : "Withdrawn"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const category = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" className="h-8 w-8 p-0" />}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">
                Category Actions
              </DropdownMenuLabel>
              <DropdownMenuItem
                render={
                  <Link
                    href={`/dashboard/products/categories/${category.id}`}
                  />
                }
              >
                <ExternalLink className="mr-2 size-4 text-primary" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setCreatedShare(null);
                  setSharing(category);
                }}
              >
                <QrCode className="mr-2 size-4 text-primary" />
                Share / QR code
              </DropdownMenuItem>
              {mayEdit ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setEditing(category)}>
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                  {category.active && (
                    <DropdownMenuItem
                      className="text-danger focus:text-danger"
                      onClick={() => withdrawMutation.mutate(category.id)}
                      disabled={withdrawMutation.isPending}
                    >
                      <Archive className="mr-2 size-4" />
                      Withdraw
                    </DropdownMenuItem>
                  )}
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <Tags className="size-4" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">Catalogue</h1>
          <p className="text-sm text-muted-foreground">
            What a product is, and whose mark it carries — the two lists the
            product form picks from
          </p>
        </div>
      </div>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              The taxonomy products are filed under — and what regulatory
              standards attach to.
            </p>
            {mayEdit && (
              <Button size="sm" className="shrink-0" onClick={() => setCreating(true)}>
                <Plus className="mr-1.5 size-4" />
                New Category
              </Button>
            )}
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : categories && categories.length > 0 ? (
            <DataTable
              columns={columns}
              data={categories}
              filterPlaceholder="Search categories..."
              filterColumn="name"
              pageSize={10}
              noBorder
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <Tags className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No categories yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                A category is what a product says it is. Add the first one.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="brands">
          <BrandsTab mayEdit={mayEdit} />
        </TabsContent>
      </Tabs>

      <CategoryDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={(category) => {
          if (category.share) {
            setCreatedShare(category.share);
            setSharing(category);
          }
        }}
      />
      <CategoryDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        category={editing ?? undefined}
      />
      <CategoryShareDialog
        category={sharing}
        open={sharing !== null}
        initialShareUrl={createdShare?.url}
        onOpenChange={(open) => {
          if (!open) {
            setSharing(null);
            setCreatedShare(null);
          }
        }}
      />
    </div>
  );
}

/**
 * The organization's own marks.
 *
 * A sibling list rather than something nested under a category: one
 * manufacturer's brands routinely cross categories — Bralirwa brews Primus and
 * bottles Fanta Orange — so the categories column here is read off the
 * products, never stored.
 */
function BrandsTab({ mayEdit }: { mayEdit: boolean }) {
  const { data: brands, isLoading } = useBrands();
  const withdrawMutation = useWithdrawBrand();
  const [editing, setEditing] = useState<Brand | null>(null);
  const [creating, setCreating] = useState(false);

  const columns: ColumnDef<TableFeatures, Brand>[] = [
    {
      accessorKey: "name",
      header: "Brand",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Bookmark className="size-4 shrink-0 text-primary" />
          <div>
            <span className="text-sm font-medium text-foreground">
              {row.getValue("name")}
            </span>
            <p className="font-mono text-xs text-muted-foreground">
              {row.original.code}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "categories",
      header: "Sold as",
      cell: ({ row }) => {
        const categories = row.getValue("categories") as string[];
        if (categories.length === 0) {
          return <span className="text-xs text-faint">No products yet</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {categories.map((name) => (
              <Badge key={name} variant="outline" className="text-[10px]">
                {name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "productCount",
      header: "Products",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("productCount")}
        </span>
      ),
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => {
        const active = row.getValue("active") as boolean;
        return (
          <Badge
            variant="outline"
            className={cn(
              active
                ? "border-success bg-success text-white"
                : "border-border bg-muted text-muted-foreground",
            )}
          >
            {active ? "Active" : "Withdrawn"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const brand = row.original;
        if (!mayEdit) return null;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setEditing(brand)}
            >
              <Pencil className="size-3" />
              <span className="ml-1">Rename</span>
            </Button>
            {brand.active && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-danger hover:bg-danger/10 hover:text-danger"
                onClick={() => withdrawMutation.mutate(brand.id)}
                disabled={withdrawMutation.isPending}
              >
                <Archive className="size-3" />
                <span className="ml-1">Withdraw</span>
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            The marks your products are sold under. A brand belongs to your
            business, not to one category — the same mark can appear wherever
            you file products.
          </p>
          {mayEdit && (
            <Button size="sm" className="shrink-0" onClick={() => setCreating(true)}>
              <Plus className="mr-1.5 size-4" />
              New Brand
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : brands && brands.length > 0 ? (
          <DataTable
            columns={columns}
            data={brands}
            filterPlaceholder="Search brands..."
            filterColumn="name"
            pageSize={10}
            noBorder
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
              <Bookmark className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No brands yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add the marks you sell under, then pick one when you create a
              product.
            </p>
          </div>
        )}

        <BrandDialog open={creating} onOpenChange={setCreating} />
        <BrandDialog
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
          brand={editing ?? undefined}
        />
      </CardContent>
    </Card>
  );
}

/** Create when given no brand, rename when given one. */
function BrandDialog({
  open,
  onOpenChange,
  brand,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  brand?: Brand;
}) {
  const editing = brand !== undefined;
  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();

  const [name, setName] = useState("");
  const [seeded, setSeeded] = useState<number | null>(null);
  const key = brand?.id ?? 0;
  if (open && seeded !== key) {
    setSeeded(key);
    setName(brand?.name ?? "");
  }

  const pending = createMutation.isPending || updateMutation.isPending;
  const derivedCode = deriveCode(name);
  const valid = name.trim().length >= 2 && (editing || derivedCode.length >= 2);

  const submit = async () => {
    if (editing) {
      await updateMutation.mutateAsync({ id: brand.id, name: name.trim() });
    } else {
      await createMutation.mutateAsync(name.trim());
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogTitle>{editing ? "Rename Brand" : "New Brand"}</DialogTitle>
        <DialogDescription>
          {editing
            ? `Filed as ${brand.code}, which is fixed — products refer to it.`
            : "The mark as it appears on the pack."}
        </DialogDescription>

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mützig"
              autoFocus
            />
            {!editing && (
              <p className="text-xs text-faint">
                Filed as{" "}
                <span className="font-mono text-muted-foreground">
                  {derivedCode || "—"}
                </span>
                , so a second spelling cannot become a second brand.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={!valid || pending}>
              {pending && <LoaderCircle className="mr-1 size-3 animate-spin" />}
              {editing ? "Save name" : "Add brand"}
            </Button>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
