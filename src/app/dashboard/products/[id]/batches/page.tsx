"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { useBatches } from "@/hooks/batches";
import { useProduct } from "@/hooks/products";
import type { Batch } from "@/services/batch.service";

const columns: ColumnDef<TableFeatures, Batch>[] = [
  {
    accessorKey: "batchCode",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Batch Code
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Layers className="size-4 text-muted-foreground" />
        <span className="font-medium">{row.getValue("batchCode")}</span>
      </div>
    ),
  },
  {
    accessorKey: "manufacturedOn",
    header: "Manufactured",
    cell: ({ row }) => row.getValue("manufacturedOn") || "—",
  },
  {
    accessorKey: "expiresOn",
    header: "Expires",
    cell: ({ row }) => row.getValue("expiresOn") || "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
          {status}
        </Badge>
      );
    },
  },
];

export default function BatchesPage() {
  const params = useParams();
  const productId = Number(params.id);
  const { data: product } = useProduct(productId);
  const { data: batches, isLoading } = useBatches(productId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Batches — {product?.name || "..."}
          </h1>
          <p className="text-muted-foreground">
            Production batches for this product. Each batch groups units manufactured together.
          </p>
        </div>
        <Button render={<Link href={`/dashboard/products/${productId}/batches/new`} />}>
          <Plus className="mr-2 size-4" />
          Create Batch
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batches</CardTitle>
          <CardDescription>{batches?.length ?? 0} batch(es)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Loading batches...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={batches ?? []}
              filterPlaceholder="Search batches..."
              filterColumn="batchCode"
              showPagination={false}
              noBorder
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
