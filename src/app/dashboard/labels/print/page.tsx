"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Loader2,
  Printer,
  QrCode,
  Search,
} from "lucide-react";
import { LabelStudioWorkspace } from "@/components/labels/label-studio-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { useIdentityPools } from "@/hooks/identity-pools";
import type { LabelTemplateId } from "@/lib/label-studio";
import type { IdentityPool } from "@/services/identity-pool.service";

const poolColumns: ColumnDef<TableFeatures, IdentityPool>[] = [
  {
    accessorKey: "productName",
    header: "Product",
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-foreground">
          {row.original.productName ?? "—"}
        </div>
        {row.original.productSku ? (
          <div className="font-mono text-[11px] text-muted-foreground">
            {row.original.productSku}
          </div>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "id",
    header: "Pool #",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        #{row.original.id}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: () => (
      <Badge
        variant="outline"
        className="border-success/40 bg-success/10 text-[10px] font-semibold text-success"
      >
        Ready
      </Badge>
    ),
  },
  {
    accessorKey: "requestedCount",
    header: () => <div className="text-right">Labels</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono text-sm font-semibold tabular-nums">
        {row.original.requestedCount.toLocaleString()}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="text-right">
        <Button
          size="sm"
          className="h-7 gap-1.5 text-xs opacity-80 group-hover:opacity-100"
          nativeButton={false}
          render={
            <Link
              href={`/dashboard/labels/print?poolId=${row.original.id}&template=unit`}
            />
          }
        >
          <Printer className="size-3" /> Print
        </Button>
      </div>
    ),
  },
];

function LabelStudioRouter() {
  const params = useSearchParams();
  const poolId = Number(params.get("poolId") ?? "0");
  const initialPreset = (params.get("template") as LabelTemplateId) || "unit";

  if (poolId && !Number.isNaN(poolId)) {
    return (
      <LabelStudioWorkspace poolId={poolId} initialPreset={initialPreset} />
    );
  }

  return <LabelStudioLauncher />;
}

function LabelStudioLauncher() {
  const { data, isLoading } = useIdentityPools();
  const [search, setSearch] = useState("");
  const readyPools = (data?.content ?? []).filter((p) => p.status === "READY");
  const readyCodeCount = readyPools.reduce(
    (total, pool) => total + pool.requestedCount,
    0,
  );

  const filteredPools = readyPools.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.productName?.toLowerCase().includes(q) ||
      p.productSku?.toLowerCase().includes(q) ||
      String(p.id).includes(q)
    );
  });

  return (
    <div className="space-y-4 px-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Printer className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Print Labels</h1>
            <p className="text-sm text-muted-foreground">
              {readyPools.length > 0
                ? `${readyPools.length} pool${readyPools.length !== 1 ? "s" : ""} ready · ${readyCodeCount.toLocaleString()} labels`
                : "No ready pools"}
            </p>
          </div>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search pools"
            placeholder="Search product or pool…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 bg-muted/30 pl-9 text-xs"
          />
        </div>
      </div>

      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10">
              <Loader2 className="size-5 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading…</p>
            </div>
          ) : readyPools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="mb-3 rounded-full bg-muted p-3">
                <QrCode className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No ready pools</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Generate codes from a product&apos;s Identities tab first.
              </p>
              <Button
                className="mt-4 h-8 gap-1.5 text-xs"
                nativeButton={false}
                render={<Link href="/dashboard/products" />}
              >
                Go to Products
              </Button>
            </div>
          ) : (
            <DataTable
              columns={poolColumns}
              data={filteredPools}
              pageSize={10}
              showFilter={false}
              showSelectionCount={false}
              noBorder
              rowClassName={() => "group"}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function LabelPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <LabelStudioRouter />
    </Suspense>
  );
}
