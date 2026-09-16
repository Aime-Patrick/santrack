"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  QrCode,
  RefreshCw,
  XCircle,
  Factory,
  Download,
  ImageDown,
  Sparkles,
  Printer,
  Plus,
  MoreHorizontal,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useIdentityPools,
  useRequestIdentities,
  useResumePool,
  useExportPool,
  useExportPoolImages,
} from "@/hooks/identity-pools";
import type { IdentityPool } from "@/services/identity-pool.service";
import { cn } from "@/lib/utils";

export function IdentityPoolsPanel({
  productId,
  productName,
  onPrepare,
}: {
  productId: number;
  productName: string;
  onPrepare: () => void;
}) {
  const { data, isLoading, refetch, isRefetching } = useIdentityPools(productId);
  const pools = data?.content ?? [];
  const slug = productName.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="min-w-0 space-y-6">
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="border-b pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-semibold">Code runs</CardTitle>
              <CardDescription className="mt-1 max-w-2xl">
                Prepared identity pools for this product. Print labels, then confirm
                them on a production run.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-8 shrink-0 gap-1.5 text-xs"
            >
              <RefreshCw
                className={cn("size-3.5", isRefetching && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="min-w-0 pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" /> Loading…
            </div>
          ) : pools.length === 0 ? (
            <EmptyState onPrepare={onPrepare} />
          ) : (
            <ul className="grid min-w-0 gap-3">
              {pools.map((pool) => (
                <li key={pool.id} className="min-w-0">
                  <PoolCard pool={pool} slug={slug} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function PrepareCodesDialog({
  productId,
  productName,
  open,
  onOpenChange,
}: {
  productId: number;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [count, setCount] = useState("");
  const request = useRequestIdentities();

  const parsed = Number(count);
  const valid = Number.isInteger(parsed) && parsed > 0;

  const resetAndClose = () => {
    setCount("");
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setCount("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
              <QrCode className="size-4" />
            </span>
            Prepare codes
          </DialogTitle>
          <DialogDescription>
            Mint a new pool of printable QR identities for {productName}. These
            are not stock yet — print labels, then use Produce on a manufacturing
            run.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 py-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid || request.isPending) return;
            request.mutate(
              { productId, count: parsed },
              {
                onSuccess: () => {
                  setCount("");
                  onOpenChange(false);
                },
              },
            );
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="prepare-count" className="text-xs font-medium">
              How many codes
            </Label>
            <Input
              id="prepare-count"
              inputMode="numeric"
              placeholder="e.g. 5000"
              value={count}
              onChange={(e) =>
                setCount(e.target.value.replace(/[^0-9]/g, ""))
              }
              className="h-10 font-mono"
              autoFocus
            />
            <p className="text-[11px] leading-4 text-muted-foreground">
              Each code is a permanent unit identity (one QR per physical unit).
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={resetAndClose}
              disabled={request.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || request.isPending}>
              {request.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Preparing…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" /> Prepare codes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PoolCard({ pool, slug }: { pool: IdentityPool; slug: string }) {
  const resume = useResumePool();
  const exportMutation = useExportPool();
  const exportImages = useExportPoolImages();
  const [imgProgress, setImgProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  const ready = pool.status === "READY";
  const busy =
    exportMutation.isPending || exportImages.isPending || resume.isPending;

  return (
    <div className="min-w-0 rounded-xl border border-border/80 bg-[#f8fafc] p-3.5 shadow-2xs sm:p-4">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-center lg:gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Run
            </p>
            <p className="mt-0.5 font-mono text-sm font-bold text-foreground">
              #{pool.id}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Codes
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
              {pool.requestedCount.toLocaleString()}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </p>
            <div className="mt-1">
              <PoolStatusBadge pool={pool} />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Created
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {new Date(pool.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs"
            disabled={!ready || busy}
            title="Print unit labels (template + QR bound to pool)"
            nativeButton={false}
            render={
              <Link
                href={`/dashboard/labels/print?poolId=${pool.id}&template=unit`}
              />
            }
          >
            <Printer className="size-3.5" />
            <span className="ml-1.5">Labels</span>
          </Button>

          <Button
            size="sm"
            className="h-8 px-2.5 text-xs"
            disabled={!ready}
            nativeButton={false}
            render={<Link href="/dashboard/manufacturing" />}
          >
            <Factory className="size-3.5" />
            <span className="ml-1.5">Produce</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={busy && pool.status !== "FAILED"}
                  aria-label={`More actions for pool ${pool.id}`}
                />
              }
            >
              <MoreHorizontal className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {pool.status === "FAILED" ? (
                <>
                  <DropdownMenuItem
                    disabled={resume.isPending}
                    onClick={() => resume.mutate(pool.id)}
                  >
                    <RefreshCw className="size-3.5" />
                    Resume minting
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : null}
              <DropdownMenuItem
                disabled={!ready || busy}
                onClick={() =>
                  exportMutation.mutate({
                    id: pool.id,
                    filename: `pool-${pool.id}-${slug}-codes.csv`,
                  })
                }
              >
                {exportMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!ready || busy}
                onClick={() => {
                  setImgProgress(null);
                  exportImages.mutate(
                    {
                      id: pool.id,
                      filename: `pool-${pool.id}-${slug}-qr-images.zip`,
                      onProgress: (done, total) => setImgProgress({ done, total }),
                    },
                    { onSettled: () => setImgProgress(null) },
                  );
                }}
              >
                {exportImages.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ImageDown className="size-3.5" />
                )}
                {imgProgress
                  ? `QR ZIP ${imgProgress.done}/${imgProgress.total}`
                  : "Download QR ZIP"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function PoolStatusBadge({ pool }: { pool: IdentityPool }) {
  if (pool.status === "GENERATING") {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 border-amber-500/30 bg-amber-50 text-xs font-medium text-amber-600"
      >
        <Loader2 className="size-3 animate-spin" /> Minting…
      </Badge>
    );
  }
  if (pool.status === "FAILED") {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 border-danger/30 bg-red-50 text-xs font-medium text-danger"
      >
        <XCircle className="size-3" /> Failed
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="gap-1.5 border-emerald-500/30 bg-emerald-50 text-xs font-medium text-emerald-600"
    >
      <CheckCircle2 className="size-3" /> Ready
    </Badge>
  );
}

function EmptyState({ onPrepare }: { onPrepare: () => void }) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary-light">
        <QrCode className="size-6 text-primary" />
      </div>
      <p className="font-medium">No code runs yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Prepare a pool of QR identities, then print labels for production.
      </p>
      <Button size="sm" className="mt-4 gap-1.5" onClick={onPrepare}>
        <Plus className="size-3.5" />
        Prepare codes
      </Button>
    </div>
  );
}
