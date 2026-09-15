"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownLeft, Boxes, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockPositionsPanel } from "@/components/inventory/stock-positions-panel";
import { InventoryItemsPanel } from "@/components/inventory/inventory-items-panel";
import { useCapabilities } from "@/hooks/permissions";
import { useCurrentUser } from "@/hooks/use-current-user";
import dynamic from "next/dynamic";

const StockTransferPanel = dynamic(
  () =>
    import("@/components/inventory/stock-transfer-panel").then((m) => ({
      default: m.StockTransferPanel,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    ),
  },
);

function InventoryWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get("tab") ?? "positions");
  const permissions = useCapabilities();
  const { data: me } = useCurrentUser();
  const orgType = me?.organization?.type;
  const isAutomaticStockInOrg = orgType === "RETAILER" || orgType === "SHOP";
  const canTransfer = permissions.can("MOVE_STOCK") && !isAutomaticStockInOrg;
  const canReceive = permissions.can("MOVE_STOCK") && isAutomaticStockInOrg;
  const transferView = searchParams.get("view");

  useEffect(() => {
    const wanted = searchParams.get("tab");
    if (!wanted || wanted === tab) return;

    if (wanted === "transfer" && !canTransfer) {
      setTab(canReceive ? "receive" : "positions");
      return;
    }
    if (wanted === "receive" && !canReceive) {
      setTab(canTransfer ? "transfer" : "positions");
      return;
    }
    setTab(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, canTransfer, canReceive]);

  const select = (next: string) => {
    setTab(next);
    router.replace(`/dashboard/inventory?tab=${next}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Boxes className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Inventory</h1>
            <p className="text-sm text-muted-foreground">
              What you hold, where it is, and what is moving.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canReceive && (
            <Button variant="outline" size="sm" onClick={() => select("receive")}>
              <ArrowDownLeft className="mr-2 size-4" /> Receive stock
            </Button>
          )}
          {canTransfer && (
            <Button
              size="sm"
              onClick={() => {
                setTab("transfer");
                router.replace("/dashboard/inventory?tab=transfer&view=dispatch", {
                  scroll: false,
                });
              }}
            >
              <Truck className="mr-2 size-4" /> Dispatch transfer
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={select} className="space-y-4">
        <TabsList className="rounded-xl border border-border/80 bg-muted/50 p-1">
          <TabsTrigger value="positions" className="gap-2">
            <Boxes className="size-4" /> By product
          </TabsTrigger>
          <TabsTrigger value="items" className="gap-2">
            <Package className="size-4" /> By code
          </TabsTrigger>
          {canTransfer && (
            <TabsTrigger value="transfer" className="gap-2">
              <Truck className="size-4" /> Transfers
            </TabsTrigger>
          )}
          {canReceive && (
            <TabsTrigger value="receive" className="gap-2">
              <ArrowDownLeft className="size-4" /> Receive
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="positions">
          <StockPositionsPanel />
        </TabsContent>
        <TabsContent value="items">
          <InventoryItemsPanel />
        </TabsContent>
        {canTransfer && (
          <TabsContent value="transfer">
            <StockTransferPanel initialView={transferView} />
          </TabsContent>
        )}
        {canReceive && (
          <TabsContent value="receive">
            <StockTransferPanel receiveOnly />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Loading inventory…
        </div>
      }
    >
      <InventoryWorkspace />
    </Suspense>
  );
}
