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
import { useCapabilities } from "@/hooks/permissions";
import type { InventoryPosition } from "@/services/inventory.service";

function buildColumns(canTransfer: boolean, canRunProduction: boolean): ColumnDef<TableFeatures, InventoryPosition>[] {
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
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
          Available
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const units = row.original.availableUnits ?? 0;
        return (
          <div>
            <span className="font-mono text-base font-bold text-success">
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
            className="border-warning/40 bg-warning/10 font-mono text-xs text-warning-foreground"
          >
            {blocked.toLocaleString()} units
          </Badge>
        );
      },
    },
    {
      accessorKey: "inTransitUnits",
      header: "In transit",
      cell: ({ row }) => {
        const transit = row.original.inTransitUnits ?? 0;
        if (transit === 0)
          return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 font-mono text-xs text-primary"
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
              className="border-success/30 bg-success/10 font-medium text-success"
            >
              In stock
            </Badge>
          );
        }
        if (blocked > 0) {
          return (
            <Badge
              variant="outline"
              className="border-warning/40 bg-warning/10 font-medium text-warning-foreground"
            >
              Quarantined
            </Badge>
          );
        }
        if (inTransit > 0) {
          return (
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 font-medium text-primary"
            >
              In transit
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="border-danger/30 bg-danger/10 font-medium text-danger"
          >
            Out of stock
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
                {canTransfer && (
                  <DropdownMenuItem
                    nativeButton={false}
                    render={
                      <Link href="/dashboard/inventory?tab=transfer&view=dispatch" />
                    }
                  >
                    <Truck className="mr-2 size-4" /> Transfer stock
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  nativeButton={false}
                  render={<Link href="/dashboard/manufacturing/trace" />}
                >
                  <PackageCheck className="mr-2 size-4" /> Scan &amp; pack
                </DropdownMenuItem>
                {canRunProduction && (
                  <DropdownMenuItem
                    nativeButton={false}
                    render={<Link href="/dashboard/manufacturing" />}
                  >
                    <PackagePlus className="mr-2 size-4" /> Production pipeline
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  nativeButton={false}
                  render={<Link href="/dashboard/inventory/opening-stock" />}
                >
                  <Plus className="mr-2 size-4" /> Declare opening stock
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
  const permissions = useCapabilities();
  const canTransfer = permissions.can("MOVE_STOCK");
  const canRunProduction = permissions.can("RUN_PRODUCTION");
  const canDeclareOpening = permissions.can("REGISTER_IDENTITY");

  const { data: positions, isLoading } = useInventoryPositions(
    locationFilter ? Number(locationFilter) : undefined,
  );
  const { data: locations } = useLocations();
  const columns = useMemo(
    () => buildColumns(canTransfer, canRunProduction),
    [canTransfer, canRunProduction],
  );

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
          title="Available units"
          value={totalAvailable.toLocaleString()}
          icon={<Boxes className="size-4" />}
          iconBg="bg-success"
          caption="Ready for dispatch &amp; sale"
        />
        <MetricCard
          title="Products in stock"
          value={inStockProducts}
          icon={<Package className="size-4" />}
          iconBg="bg-primary"
          caption={`Of ${positions?.length ?? 0} listed`}
          href="/dashboard/inventory?tab=items"
        />
        <MetricCard
          title="Quarantined"
          value={totalBlocked.toLocaleString()}
          icon={<ShieldAlert className="size-4" />}
          iconBg={totalBlocked > 0 ? "bg-warning text-foreground" : "bg-muted text-muted-foreground"}
          caption="Held for inspection"
          href="/dashboard/manufacturing/trace"
        />
        <MetricCard
          title="In transit"
          value={totalTransit.toLocaleString()}
          icon={<Truck className="size-4" />}
          iconBg={totalTransit > 0 ? "bg-primary" : "bg-muted text-muted-foreground"}
          caption="Moving between parties"
          href={canTransfer ? "/dashboard/inventory?tab=transfer" : undefined}
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          How much of each product you hold, and where pressure is.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            onValueChange={(v) =>
              setLocationFilter(v === "all" || v === null ? "" : v)
            }
            value={locationFilter || "all"}
          >
            <SelectTrigger className="h-10 w-50">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locations?.map((l) => (
                <SelectItem key={l.id} value={String(l.id)}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canDeclareOpening && (
            <Button
              variant="outline"
              className="h-10"
              nativeButton={false}
              render={<Link href="/dashboard/inventory/opening-stock" />}
            >
              <Plus className="mr-2 size-4" /> Declare opening stock
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base font-semibold">By product</CardTitle>
          <CardDescription>
            {positions?.length ?? 0} product line
            {(positions?.length ?? 0) === 1 ? "" : "s"}
            {locationFilter ? " at this location" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex h-36 items-center justify-center text-muted-foreground">
              Loading stock…
            </div>
          ) : (positions?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Boxes className="size-8 text-border" />
              <div>
                <p className="text-sm font-medium text-foreground">No stock recorded yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Stock arrives from finished production or incoming transfers.
                </p>
              </div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={positions ?? []}
              filterPlaceholder="Filter by product name…"
              filterColumn="productName"
              pageSize={10}
              noBorder
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
