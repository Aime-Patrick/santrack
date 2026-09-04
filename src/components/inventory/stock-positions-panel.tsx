"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Package,
  Boxes,
  Truck,
  ShieldAlert,
  MoreHorizontal,
  Plus,
  ScanLine,
  PackageCheck,
  PackagePlus,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useInventoryPositions } from "@/hooks/inventory";
import { useLocations } from "@/hooks/locations";
import type { InventoryPosition } from "@/services/inventory.service";

function buildColumns(): ColumnDef<TableFeatures, InventoryPosition>[] {
  return [
    {
      accessorKey: "productName",
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
        const pos = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
              <Package className="size-4" />
            </div>
            <div>
              <div className="font-semibold text-foreground">
                {pos.productName || `Product #${pos.productId ?? "—"}`}
              </div>
              <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                {pos.productSku || "NO-SKU"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "availableUnits",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Available Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const units = row.original.availableUnits ?? 0;
        return (
          <div>
            <span className="font-mono text-base font-bold text-emerald-600">
              {units.toLocaleString()}
            </span>
            <span className="ml-1 text-xs text-muted-foreground">units</span>
          </div>
        );
      },
    },
    {
      accessorKey: "identities",
      header: "Held codes",
      cell: ({ row }) => {
        const count = row.original.identities ?? 0;
        return (
          <div className="text-sm font-medium">
            {count.toLocaleString()}{" "}
            <span className="text-xs text-muted-foreground">identities</span>
          </div>
        );
      },
    },
    {
      accessorKey: "blockedUnits",
      header: "Quarantine",
      cell: ({ row }) => {
        const blocked = row.original.blockedUnits ?? 0;
        if (blocked === 0)
          return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-50 font-mono text-xs text-amber-600"
          >
            {blocked.toLocaleString()} units
          </Badge>
        );
      },
    },
    {
      accessorKey: "inTransitUnits",
      header: "In Transit",
      cell: ({ row }) => {
        const transit = row.original.inTransitUnits ?? 0;
        if (transit === 0)
          return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <Badge
            variant="outline"
            className="border-blue-500/30 bg-primary-light font-mono text-xs text-blue-600"
          >
            {transit.toLocaleString()} units
          </Badge>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const available = row.original.availableUnits ?? 0;
        const blocked = row.original.blockedUnits ?? 0;
        const inTransit = row.original.inTransitUnits ?? 0;

        if (available > 0) {
          return (
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-50 font-medium text-emerald-600"
            >
              In Stock
            </Badge>
          );
        }
        if (blocked > 0) {
          return (
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-50 font-medium text-amber-600"
            >
              Quarantined
            </Badge>
          );
        }
        if (inTransit > 0) {
          return (
            <Badge
              variant="outline"
              className="border-blue-500/30 bg-primary-light font-medium text-blue-600"
            >
              In Transit
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="border-rose-500/30 bg-red-50 font-medium text-rose-600"
          >
            Out of Stock
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const pos = row.original;
        const codesHref = pos.productId
          ? `/dashboard/inventory?tab=items&productId=${pos.productId}`
          : "/dashboard/inventory?tab=items";

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="sm" className="size-8 p-0">
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">
                  {pos.productName || "Actions"}
                </DropdownMenuLabel>
                <DropdownMenuItem
                  nativeButton={false}
                  render={<Link href={codesHref} />}
                >
                  <ScanLine className="mr-2 size-4 text-primary" />
                  View stock codes
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  nativeButton={false}
                  render={
                    <Link href="/dashboard/manufacturing/stock-transfer" />
                  }
                >
                  <Truck className="mr-2 size-4" /> Transfer stock
                </DropdownMenuItem>
                <DropdownMenuItem
                  nativeButton={false}
                  render={<Link href="/dashboard/manufacturing/pack" />}
                >
                  <PackageCheck className="mr-2 size-4" /> Pack into cartons
                </DropdownMenuItem>
                <DropdownMenuItem
                  nativeButton={false}
                  render={
                    <Link href="/dashboard/manufacturing/register-package" />
                  }
                >
                  <PackagePlus className="mr-2 size-4" /> Register container
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  nativeButton={false}
                  render={<Link href="/dashboard/inventory/opening-stock" />}
                >
                  <Plus className="mr-2 size-4" /> Onboard opening stock
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}

export function StockPositionsPanel() {
  const [locationFilter, setLocationFilter] = useState("");
  const { data: positions, isLoading } = useInventoryPositions(
    locationFilter ? Number(locationFilter) : undefined,
  );
  const { data: locations } = useLocations();
  const columns = useMemo(() => buildColumns(), []);

  const totalAvailable =
    positions?.reduce((acc, p) => acc + (p.availableUnits || 0), 0) ?? 0;
  const inStockProducts =
    positions?.filter((p) => (p.availableUnits || 0) > 0).length ?? 0;
  const totalBlocked =
    positions?.reduce((acc, p) => acc + (p.blockedUnits || 0), 0) ?? 0;
  const totalTransit =
    positions?.reduce((acc, p) => acc + (p.inTransitUnits || 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard
          title="Available Units"
          value={totalAvailable.toLocaleString()}
          icon={<Boxes className="size-4" />}
          iconBg="bg-emerald-500"
          caption="Ready for dispatch &amp; sale"
        />
        <MetricCard
          title="Active Products"
          value={inStockProducts}
          icon={<Package className="size-4" />}
          iconBg="bg-primary"
          caption={`Out of ${positions?.length ?? 0} listed products`}
        />
        <MetricCard
          title="Quarantined"
          value={totalBlocked.toLocaleString()}
          icon={<ShieldAlert className="size-4" />}
          iconBg={
            totalBlocked > 0 ? "bg-amber-500" : "bg-muted text-muted-foreground"
          }
          caption="Held for inspection"
        />
        <MetricCard
          title="In Transit"
          value={totalTransit.toLocaleString()}
          icon={<Truck className="size-4" />}
          iconBg={
            totalTransit > 0 ? "bg-blue-500" : "bg-muted text-muted-foreground"
          }
          caption="Moving between locations"
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-3">
          <Select
            onValueChange={(v) =>
              setLocationFilter(v === "all" || v === null ? "" : v)
            }
            value={locationFilter || "all"}
          >
            <SelectTrigger className="h-10 w-50">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations?.map((l) => (
                <SelectItem key={l.id} value={String(l.id)}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="h-10 shadow-sm"
            nativeButton={false}
            render={<Link href="/dashboard/inventory/opening-stock" />}
          >
            <Plus className="mr-2 size-4" /> Opening stock
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base font-semibold">
            Stock positions by product
          </CardTitle>
          <CardDescription>
            {positions?.length ?? 0} product line(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex h-36 items-center justify-center text-muted-foreground">
              Loading inventory positions...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={positions ?? []}
              filterPlaceholder="Filter by product name..."
              filterColumn="productName"
              pageSize={15}
              noBorder
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
