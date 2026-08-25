"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PackageCheck,
  PackageOpen,
  Trash2,
  Box,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  RefreshCw,
  ArrowUpRight,
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
import { QrScanInput } from "@/components/ui/qr-scanner";
import {
  useItemContents,
  useOpenPackage,
  usePackItems,
  useResolveScan,
} from "@/hooks/items";
import { cn } from "@/lib/utils";
import type { Item } from "@/services/item.service";

/** What one scan did, so a single input can still explain itself. */
interface ScanOutcome {
  id: number;
  code: string;
  tone: "container" | "queued" | "ignored" | "error";
  message: string;
}

/**
 * Packing, driven by scanning rather than by choosing.
 *
 * This screen used to have two scan boxes — one for the container, one for the
 * items — so the operator had to tell the system what they were about to scan
 * before scanning it. That is asking a question the platform can already
 * answer: every identity records whether it is a UNIT or a PACKAGE, so the
 * code itself says which box it belongs in.
 *
 * It also cost accuracy. Someone holding a scanner gun and a carton has one
 * hand free; making them click between two fields is how a pallet code ends up
 * in the contents list. Now there is one box: the first container scanned
 * becomes the container, and everything after it goes inside.
 */
export default function PackItemsPage() {
  const [container, setContainer] = useState<Item | null>(null);
  const [queued, setQueued] = useState<Item[]>([]);
  const [log, setLog] = useState<ScanOutcome[]>([]);

  const resolve = useResolveScan();
  const packItems = usePackItems();
  const openSeal = useOpenPackage();
  const { data: contents } = useItemContents(container?.qrCode ?? "");

  const note = (outcome: Omit<ScanOutcome, "id">) =>
    setLog((prev) => [{ ...outcome, id: Date.now() + Math.random() }, ...prev].slice(0, 8));

  /**
   * One scan, routed by what the code turns out to be.
   *
   * The order of these checks is the order they matter in: mistakes first, so
   * a duplicate or a foreign code is called out rather than silently dropped.
   */
  const handleScan = async (raw: string) => {
    const code = raw.trim();
    if (!code) return;

    let item: Item;
    try {
      item = await resolve.mutateAsync(code);
    } catch {
      note({
        code,
        tone: "error",
        message: "Not an identity this platform issued, or not one you can see",
      });
      return;
    }

    if (container && item.id === container.id) {
      note({ code: item.code, tone: "ignored", message: "That is the container itself" });
      return;
    }

    // No container yet: the first package scanned is the one being filled.
    if (!container) {
      if (item.kind !== "PACKAGE") {
        note({
          code: item.code,
          tone: "error",
          message: "Scan the container first — a unit cannot hold anything",
        });
        return;
      }
      setContainer(item);
      note({
        code: item.code,
        tone: "container",
        message: `Packing into this ${(item.packageType ?? "container").toLowerCase()}`,
      });
      return;
    }

    if (queued.some((q) => q.id === item.id)) {
      note({ code: item.code, tone: "ignored", message: "Already scanned" });
      return;
    }

    if (item.parentId === container.id) {
      note({ code: item.code, tone: "ignored", message: "Already inside this container" });
      return;
    }

    // A container inside a container is normal — box into carton, carton onto
    // pallet — so a package scanned after the first is nested, not swapped.
    setQueued((prev) => [...prev, item]);
    note({
      code: item.code,
      tone: "queued",
      message:
        item.kind === "PACKAGE"
          ? `Nesting this ${(item.packageType ?? "container").toLowerCase()} inside`
          : (item.productName ?? "Ready to pack"),
    });
  };

  const startOver = () => {
    setContainer(null);
    setQueued([]);
    setLog([]);
  };

  const sealed = container?.sealState === "SEALED";

  const pack = () => {
    if (!container || queued.length === 0) return;
    packItems.mutate(
      {
        qrCode: container.qrCode,
        input: { childQrCodes: queued.map((q) => q.qrCode) },
      },
      {
        onSuccess: () => {
          note({
            code: container.code,
            tone: "container",
            message: `Packed ${queued.length} item${queued.length === 1 ? "" : "s"}`,
          });
          setQueued([]);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <PackageCheck className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pack Items</h1>
            <p className="text-muted-foreground">
              Scan the container, then keep scanning. Each code is recognised on
              its own — nothing to choose.
            </p>
          </div>
        </div>
        {container && (
          <Button variant="outline" size="sm" onClick={startOver} className="gap-2">
            <RefreshCw className="size-3.5" />
            Start over
          </Button>
        )}
      </div>

      {/* ── The one scan box ── */}
      <Card className={cn(!container && "border-primary/40")}>
        <CardContent className="space-y-4 pt-6">
          <QrScanInput
            onScan={handleScan}
            placeholder={
              container
                ? `Scan items to put into ${container.code}…`
                : "Scan the container to fill…"
            }
          />

          {resolve.isPending && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Looking that up…
            </p>
          )}

          {/* A single input has to say what it decided, or the operator is
              scanning into a void. */}
          {log.length > 0 && (
            <div className="space-y-1">
              {log.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs",
                    entry.tone === "container" && "bg-primary/5 text-primary",
                    entry.tone === "queued" && "bg-success/5 text-success",
                    entry.tone === "ignored" && "bg-muted text-muted-foreground",
                    entry.tone === "error" && "bg-danger/5 text-danger",
                  )}
                >
                  {entry.tone === "error" ? (
                    <AlertCircle className="size-3.5 shrink-0" />
                  ) : entry.tone === "ignored" ? (
                    <Info className="size-3.5 shrink-0" />
                  ) : entry.tone === "container" ? (
                    <Box className="size-3.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="size-3.5 shrink-0" />
                  )}
                  <span className="font-mono font-medium">{entry.code}</span>
                  <span className="truncate opacity-80">{entry.message}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {/* ── Container ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Container</CardTitle>
              <CardDescription>
                {container
                  ? "The first container you scanned. Everything after it goes inside."
                  : "Nothing scanned yet."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {container ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{container.code}</span>
                    <Badge variant="outline">{container.packageType}</Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        sealed
                          ? "border-warning/30 bg-warning/10 text-warning-foreground"
                          : "border-success/30 bg-success/10 text-success",
                      )}
                    >
                      {container.sealState}
                    </Badge>
                  </div>
                  {container.locationName && (
                    <p className="text-sm text-muted-foreground">
                      At {container.locationName}
                    </p>
                  )}

                  {/* A sealed container cannot take anything, and the fix is
                      one click rather than a trip to another screen. */}
                  {sealed && (
                    <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2.5">
                      <PackageOpen className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs leading-relaxed text-warning-foreground">
                          This container is sealed. Open it before adding
                          anything — the seal state is part of its history.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 gap-2"
                          disabled={openSeal.isPending}
                          onClick={() =>
                            openSeal.mutate(
                              { qrCode: container.qrCode },
                              {
                                onSuccess: (updated) => setContainer(updated),
                              },
                            )
                          }
                        >
                          {openSeal.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <PackageOpen className="size-3.5" />
                          )}
                          Open the seal
                        </Button>
                      </div>
                    </div>
                  )}

                  <Link
                    href="/dashboard/manufacturing/trace"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Open its full record
                    <ArrowUpRight className="size-3" />
                  </Link>
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Scan a box, carton, crate or pallet to begin.
                </p>
              )}
            </CardContent>
          </Card>

          {/* ── Queue ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Ready to pack
                {queued.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {queued.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Nothing moves until you confirm, so a mis-scan can be removed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {queued.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {container
                    ? "Scan the items going in."
                    : "Scan a container first."}
                </p>
              ) : (
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {queued.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5"
                    >
                      {entry.kind === "PACKAGE" ? (
                        <Box className="size-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <PackageCheck className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="font-mono text-xs font-medium">
                        {entry.code}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {entry.productName ?? entry.packageType ?? ""}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQueued((prev) => prev.filter((q) => q.id !== entry.id))
                        }
                        className="ml-auto shrink-0 text-faint transition-colors hover:text-danger"
                        aria-label={`Remove ${entry.code}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                className="w-full"
                onClick={pack}
                disabled={packItems.isPending || queued.length === 0 || !container || sealed}
              >
                {packItems.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Packing…
                  </>
                ) : sealed ? (
                  "Open the container first"
                ) : (
                  `Pack ${queued.length} item${queued.length === 1 ? "" : "s"} into ${container?.code ?? "the container"}`
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── What is already inside ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Already inside</CardTitle>
            <CardDescription>
              {contents
                ? `${contents.remainingCount} in the container, ${contents.removedCount} taken out over its life`
                : "Scan a container to see what it holds."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contents && contents.remaining.length > 0 ? (
              <div className="space-y-1.5">
                {contents.remaining.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-border px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-medium">{item.code}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.productName || item.productSku || "—"}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : contents ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Empty.
              </p>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nothing scanned yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
