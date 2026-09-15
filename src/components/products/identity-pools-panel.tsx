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
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Code runs</CardTitle>
              <CardDescription>
                Prepared identity pools for this product. Print labels, then confirm
                them on a production run.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-8 gap-1.5 text-xs"
            >
              <RefreshCw
                className={cn("size-3.5", isRefetching && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" /> Loading…
            </div>
          ) : pools.length === 0 ? (
            <EmptyState onPrepare={onPrepare} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Run</TableHead>
                  <TableHead className="text-right">Codes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Downloads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pools.map((pool) => (
                  <PoolRow key={pool.id} pool={pool} slug={slug} />
                ))}
              </TableBody>
            </Table>
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

function PoolRow({ pool, slug }: { pool: IdentityPool; slug: string }) {
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
    <TableRow>
      <TableCell className="font-mono text-xs font-bold">#{pool.id}</TableCell>
      <TableCell className="text-right font-mono text-sm font-semibold">
        {pool.requestedCount.toLocaleString()}
      </TableCell>
      <TableCell>
        <PoolStatusBadge pool={pool} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(pool.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {pool.status === "FAILED" ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-danger hover:bg-danger/10"
              disabled={resume.isPending}
              onClick={() => resume.mutate(pool.id)}
            >
              <RefreshCw className="mr-1 size-3.5" /> Resume
            </Button>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs"
            disabled={!ready || busy}
            title="Download CSV (serial + QR payload)"
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
            <span className="ml-1.5">CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs"
            disabled={!ready || busy}
            title="Download QR images as ZIP"
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
            <span className="ml-1.5">
              {imgProgress
                ? `${imgProgress.done}/${imgProgress.total}`
                : "QR ZIP"}
            </span>
          </Button>

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
        </div>
      </TableCell>
    </TableRow>
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
