"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  QrCode,
  RefreshCw,
  XCircle,
  Factory,
  Boxes,
  Clock,
  ArrowRight,
  Sparkles,
  Download,
  ImageDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useIdentityPool,
  useIdentityPools,
  useRequestIdentities,
  useResumePool,
  useExportPool,
  useExportPoolImages,
} from "@/hooks/identity-pools";
import type {
  IdentityPool,
  PoolReconciliation,
} from "@/services/identity-pool.service";
import { cn } from "@/lib/utils";

export function IdentityPoolsPanel({
  productId,
  productName,
}: {
  productId: number;
  productName: string;
}) {
  const { data, isLoading, refetch, isRefetching } = useIdentityPools(productId);
  const [openPoolId, setOpenPoolId] = useState<number | null>(null);

  const pools = data?.content ?? [];

  return (
    <div className="space-y-6">
      {/* Code Generation Form */}
      <RequestIdentitiesCard productId={productId} productName={productName} />

      {/* Code Runs Table */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Code Runs</CardTitle>
              <CardDescription>
                Batches of unique identities generated for {productName}.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-8 gap-1.5 text-xs"
            >
              <RefreshCw className={cn("size-3.5", isRefetching && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" /> Loading code runs…
            </div>
          ) : pools.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Run</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pools.map((pool) => (
                  <PoolRow
                    key={pool.id}
                    pool={pool}
                    open={openPoolId === pool.id}
                    onToggle={() =>
                      setOpenPoolId(openPoolId === pool.id ? null : pool.id)
                    }
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Breakdown */}
      {openPoolId !== null && (
        <PoolDetail poolId={openPoolId} productName={productName} />
      )}
    </div>
  );
}

function RequestIdentitiesCard({
  productId,
  productName,
}: {
  productId: number;
  productName: string;
}) {
  const [count, setCount] = useState("");
  const request = useRequestIdentities();

  const parsed = Number(count);
  const valid = Number.isInteger(parsed) && parsed > 0;

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white shadow-xs">
            <QrCode className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Prepare Unique Codes</CardTitle>
            <CardDescription>
              Generate printable QR codes for {productName} before manufacturing.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            request.mutate(
              { productId, count: parsed },
              { onSuccess: () => setCount("") },
            );
          }}
        >
          <div className="w-56 space-y-1.5">
            <Label htmlFor="count" className="text-xs font-medium">Number of codes to generate</Label>
            <Input
              id="count"
              inputMode="numeric"
              placeholder="e.g. 5000"
              value={count}
              onChange={(e) => setCount(e.target.value.replace(/[^0-9]/g, ""))}
              className="h-10 font-mono"
            />
          </div>
          <Button type="submit" disabled={!valid || request.isPending} className="h-10">
            {request.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Minting codes…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" /> Generate Codes
              </>
            )}
          </Button>
        </form>

        <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground leading-relaxed">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            Generating codes creates printable identities. Codes enter your sellable warehouse inventory only when confirmed during a production run on{" "}
            <Link href="/dashboard/manufacturing/production" className="font-semibold text-primary underline">
              Manufacturing &gt; Production
            </Link>.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PoolRow({
  pool,
  open,
  onToggle,
}: {
  pool: IdentityPool;
  open: boolean;
  onToggle: () => void;
}) {
  const resume = useResumePool();

  return (
    <TableRow className={cn(open && "bg-muted/40 font-medium")}>
      <TableCell className="font-mono text-xs font-bold">#{pool.id}</TableCell>
      <TableCell className="text-right font-mono font-semibold text-sm">
        {pool.requestedCount.toLocaleString()}
      </TableCell>
      <TableCell>
        <PoolStatusBadge pool={pool} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        <div>{new Date(pool.createdAt).toLocaleDateString()}</div>
        {pool.requestedBy && (
          <div className="text-[11px] opacity-75">{pool.requestedBy}</div>
        )}
      </TableCell>
      <TableCell className="text-right">
        {pool.status === "FAILED" && (
          <Button
            variant="ghost"
            size="sm"
            className="mr-1 text-danger hover:bg-danger/10"
            disabled={resume.isPending}
            onClick={() => resume.mutate(pool.id)}
          >
            <RefreshCw className="mr-1 size-3.5" /> Resume
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className={cn(
            "h-8 px-3 text-xs font-medium transition-colors",
            open
              ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
              : "border-border/80 hover:bg-muted hover:text-foreground"
          )}
        >
          {open ? "Hide Details" : "View Breakdown"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

function PoolStatusBadge({ pool }: { pool: IdentityPool }) {
  if (pool.status === "GENERATING") {
    return (
      <Badge variant="outline" className="gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium text-xs">
        <Loader2 className="size-3 animate-spin text-amber-600" /> Preparing Codes…
      </Badge>
    );
  }
  if (pool.status === "FAILED") {
    return (
      <Badge variant="outline" className="gap-1.5 border-danger/30 bg-danger/10 text-danger font-medium text-xs">
        <XCircle className="size-3" /> Failed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
      <CheckCircle2 className="size-3" /> Ready for Production
    </Badge>
  );
}

function PoolDetail({
  poolId,
  productName,
}: {
  poolId: number;
  productName: string;
}) {
  const { data, isLoading } = useIdentityPool(poolId);
  const exportMutation = useExportPool();
  const exportImages = useExportPoolImages();
  const [imgProgress, setImgProgress] = useState<{ done: number; total: number } | null>(null);

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" /> Loading pool details…
        </CardContent>
      </Card>
    );
  }

  const r = data.reconciliation;
  const slug = productName.toLowerCase().replace(/\s+/g, "-");

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="pb-4 border-b">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Run #{data.id} Lifecycle Status</CardTitle>
            <CardDescription>
              {data.status === "GENERATING"
                ? `Minting in progress — ${r.minted.toLocaleString()} of ${r.requested.toLocaleString()} codes generated`
                : `${r.minted.toLocaleString()} unique codes generated for ${productName}`}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* ── CSV ── */}
            <Button
              variant="outline"
              size="sm"
              className="h-9 font-medium"
              disabled={exportMutation.isPending}
              onClick={() =>
                exportMutation.mutate({
                  id: data.id,
                  filename: `pool-${data.id}-${slug}-codes.csv`,
                })
              }
            >
              {exportMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              CSV
            </Button>

            {/* ── Images ZIP ── */}
            <div className="flex flex-col items-end gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-9 font-medium"
                disabled={exportImages.isPending}
                onClick={() => {
                  setImgProgress(null);
                  exportImages.mutate({
                    id: data.id,
                    filename: `pool-${data.id}-${slug}-qr-images.zip`,
                    onProgress: (done, total) => setImgProgress({ done, total }),
                  }, {
                    onSettled: () => setImgProgress(null),
                  });
                }}
              >
                {exportImages.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <ImageDown className="mr-2 size-4" />
                )}
                QR Images (ZIP)
              </Button>
              {imgProgress && (
                <div className="w-full space-y-0.5">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-200"
                      style={{ width: `${Math.round((imgProgress.done / imgProgress.total) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-right text-muted-foreground">
                    {imgProgress.done} / {imgProgress.total} rendered
                  </p>
                </div>
              )}
            </div>

            <Link href="/dashboard/manufacturing/production">
              <Button size="sm" className="h-9">
                <Factory className="mr-2 size-4" /> Start Production
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-muted/30 p-3.5 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Minted
            </span>
            <p className="font-mono text-xl font-bold text-foreground">
              {r.minted.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">Generated identities</p>
          </div>

          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3.5 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Awaiting Production
            </span>
            <p className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">
              {r.awaitingProduction.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">Ready on label printer</p>
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              In Stock (Finished)
            </span>
            <p className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {r.produced.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">Confirmed warehouse units</p>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3.5 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Cancelled / Defective
            </span>
            <p className="font-mono text-xl font-bold text-muted-foreground">
              {r.cancelled.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">Misprints &amp; waste</p>
          </div>
        </div>

        {/* Workflow Guidance */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
            What happens next?
          </p>
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="flex gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">
                1
              </span>
              <div>
                <p className="font-semibold text-foreground">Codes are Ready</p>
                <p className="text-muted-foreground">
                  The {r.minted.toLocaleString()} unique QR codes exist in the database and can be printed on labels.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">
                2
              </span>
              <div>
                <p className="font-semibold text-foreground">Run Production</p>
                <p className="text-muted-foreground">
                  Create a production order on <strong className="text-foreground">Manufacturing</strong> and attach this pool.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">
                3
              </span>
              <div>
                <p className="font-semibold text-foreground">Stock Confirmed</p>
                <p className="text-muted-foreground">
                  When the line completes and output is confirmed, units automatically enter your warehouse inventory.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
        <QrCode className="size-6 text-primary" />
      </div>
      <p className="font-medium">No codes prepared yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter a quantity above to mint unique QR identities for this product.
      </p>
    </div>
  );
}
