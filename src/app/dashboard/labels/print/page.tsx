"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Layers,
  Loader2,
  Printer,
  QrCode,
  Search,
  Sparkles,
} from "lucide-react";
import { LabelStudioWorkspace } from "@/components/labels/label-studio-workspace";
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
import { useIdentityPools } from "@/hooks/identity-pools";
import type { LabelTemplateId } from "@/lib/label-studio";

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
    <div className="mx-auto flex max-w-4xl flex-1 flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            nativeButton={false}
            render={<Link href="/dashboard/products" />}
          >
            <ArrowLeft className="size-3.5" /> Back to Products
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Label Studio
            </h1>
            <Badge className="bg-primary-light text-primary border-primary/20 text-xs">
              <Sparkles className="mr-1 size-3" /> Traceability Studio
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Select a minted identity pool to design labels, &quot;verify QR payloads&quot;, and download print-ready batch PDFs.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 text-xs"
          nativeButton={false}
          render={<Link href="/dashboard/products" />}
        >
          <Layers className="size-3.5" /> Generate Identities on Product
        </Button>
      </div>

      <Card className="border-border/80 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">
              Ready Code Pools
            </CardTitle>
            <CardDescription className="text-xs">
              Select a pool to launch the designer and batch print generator.
            </CardDescription>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by product or pool #…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading identity pools…</p>
            </div>
          ) : readyPools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <QrCode className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No ready identity pools found
              </p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Generate codes from a product&apos;s Identities tab first, then return here to design and print labels.
              </p>
              <Button
                className="mt-4 h-8 gap-1.5 text-xs"
                nativeButton={false}
                render={<Link href="/dashboard/products" />}
              >
                Go to Products
              </Button>
            </div>
          ) : filteredPools.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              No pools matched &quot;{search}&quot;.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {filteredPools.slice(0, 30).map((pool) => (
                <div
                  key={pool.id}
                  className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-white p-4 transition-all hover:border-primary/50 hover:shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                          {pool.productName ?? "Product"}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        Pool #{pool.id} {pool.productSku ? `· SKU: ${pool.productSku}` : ""}
                      </p>
                    </div>

                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-300 font-mono text-[10px]"
                    >
                      {pool.requestedCount.toLocaleString()} codes
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="text-[11px] text-muted-foreground">
                      Status: <span className="font-medium text-emerald-700">Ready to print</span>
                    </span>

                    <Button
                      size="sm"
                      className="h-7 gap-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary/90"
                      nativeButton={false}
                      render={
                        <Link
                          href={`/dashboard/labels/print?poolId=${pool.id}&template=unit`}
                        />
                      }
                    >
                      <Printer className="size-3" />
                      Open Studio
                      <ChevronRight className="size-3 opacity-60" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
