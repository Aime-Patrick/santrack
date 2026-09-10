"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Boxes,
  Package,
  PackageCheck,
  PackagePlus,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockPositionsPanel } from "@/components/inventory/stock-positions-panel";
import { InventoryItemsPanel } from "@/components/inventory/inventory-items-panel";
import { useCapabilities } from "@/hooks/permissions";
import { useCurrentUser } from "@/hooks/use-current-user";

/**
 * One place for stock.
 *
 * There used to be two: /dashboard/inventory and /dashboard/items, both
 * answering "what stock do we have?" from the same rows in two layouts — they
 * even exported the same function name. Two menu entries for one question meant
 * every person had to learn which of the two showed the column they wanted.
 *
 * The three movement actions below used to be menu entries too. Each of them
 * acts on stock, so each is now a button here, where the stock already is —
 * rather than a destination you navigate to and then have to find the goods
 * from all over again.
 */
function InventoryWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get("tab") ?? "positions");
  const permissions = useCapabilities();
  const { data: me } = useCurrentUser();
  const orgType = me?.organization?.type;
  // RETAILER and SHOP receive stock via Stock In and never register identities
  // or perform manual packaging operations.
  const isAutomaticStockInOrg = orgType === "RETAILER" || orgType === "SHOP";

  useEffect(() => {
    const wanted = searchParams.get("tab");
    if (wanted && wanted !== tab) setTab(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
              What you hold, where it is, and what has moved.
            </p>
          </div>
        </div>

        {/*
          The movement verbs, as actions rather than places. They stay full
          screens behind these buttons — each one is a multi-step scanning job,
          not something to squeeze into a dialog.
        */}
        <div className="flex flex-wrap items-center gap-2">
          {permissions.can("REGISTER_IDENTITY") && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/dashboard/manufacturing/register-package" />}
            >
              <PackagePlus className="mr-2 size-4" /> Register package
            </Button>
          )}
          {permissions.can("HANDLE_PACKAGING") && !isAutomaticStockInOrg && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/dashboard/manufacturing/pack" />}
            >
              <PackageCheck className="mr-2 size-4" /> Pack items
            </Button>
          )}
          {permissions.can("MOVE_STOCK") && isAutomaticStockInOrg && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/dashboard/inventory/stock-in" />}
            >
              <PackagePlus className="mr-2 size-4" /> Receive stock
            </Button>
          )}
          {permissions.can("MOVE_STOCK") && !isAutomaticStockInOrg && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/dashboard/manufacturing/stock-transfer" />}
            >
              <Truck className="mr-2 size-4" /> Transfer stock
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={select} className="space-y-4">
        <TabsList className="rounded-xl border border-border/80 bg-muted/50 p-1">
          <TabsTrigger value="positions" className="gap-2">
            <Boxes className="size-4" />
            Stock positions
          </TabsTrigger>
          <TabsTrigger value="items" className="gap-2">
            <Package className="size-4" />
            Stock codes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions">
          <StockPositionsPanel />
        </TabsContent>
        <TabsContent value="items">
          <InventoryItemsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={null}>
      <InventoryWorkspace />
    </Suspense>
  );
}
