"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Package, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { useInventoryPositions } from "@/hooks/inventory";
import { useLocations } from "@/hooks/locations";
import { useState } from "react";
import type { InventoryPosition } from "@/services/inventory.service";

const columns: ColumnDef<TableFeatures, InventoryPosition>[] = [
  {
    accessorKey: "itemCode",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Item Code
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Package className="size-4 text-muted-foreground" />
        <span className="font-medium">{row.getValue("itemCode")}</span>
      </div>
    ),
  },
  {
    accessorKey: "productName",
    header: "Product",
    cell: ({ row }) => row.getValue("productName") || "—",
  },
  {
    accessorKey: "productSku",
    header: "SKU",
  },
  {
    accessorKey: "batchCode",
    header: "Batch",
    cell: ({ row }) => row.getValue("batchCode") || "—",
  },
  {
    accessorKey: "locationName",
    header: "Location",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <MapPin className="size-3 text-muted-foreground" />
        <span>{row.getValue("locationName")}</span>
      </div>
    ),
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Qty
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-bold">{row.getValue("quantity")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>{status}</Badge>;
    },
  },
];

export default function InventoryPage() {
  const [locationFilter, setLocationFilter] = useState<string>("");
  const { data: positions, isLoading } = useInventoryPositions(
    locationFilter ? Number(locationFilter) : undefined
  );
  const { data: locations } = useLocations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Current stock positions across all your locations.
          </p>
        </div>
        <Select onValueChange={(v) => setLocationFilter(v === "all" || v === null ? "" : v)} value={locationFilter || "all"}>
          <SelectTrigger className="w-[200px]">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Positions</CardTitle>
          <CardDescription>{positions?.length ?? 0} item(s) in stock</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Loading inventory...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={positions ?? []}
              filterPlaceholder="Search inventory..."
              filterColumn="itemCode"
              pageSize={15}
              noBorder
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
