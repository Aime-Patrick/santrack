"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ClipboardList,
  FileText,
  Plus,
  Receipt,
  RotateCcw,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesOverviewPanel } from "@/components/sales/sales-overview-panel";
import { QuotationsPanel } from "@/components/sales/quotations-panel";
import { SalesOrdersPanel } from "@/components/sales/sales-orders-panel";
import { InvoicesPanel } from "@/components/sales/invoices-panel";
import { ReturnsPanel } from "@/components/sales/returns-panel";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCapabilities } from "@/hooks/permissions";
import type { OrganizationType } from "@/lib/api";

/**
 * Quotation → order → invoice → return is one deal moving through stages.
 * Tabs keep that pipeline on one screen instead of four sidebar destinations.
 */
const TABS = [
  { value: "sales", label: "Recorded sales", icon: ShoppingCart },
  { value: "quotations", label: "Quotations", icon: Receipt },
  { value: "orders", label: "Orders", icon: ClipboardList },
  { value: "invoices", label: "Invoices", icon: FileText },
  { value: "returns", label: "Returns", icon: RotateCcw },
] as const;

type SalesTab = (typeof TABS)[number]["value"];

function isCounterOrg(type: OrganizationType | undefined | null): boolean {
  return type === "RETAILER" || type === "SHOP";
}

function defaultTabForOrg(type: OrganizationType | undefined | null): SalesTab {
  switch (type) {
    case "MANUFACTURER":
      return "quotations";
    case "DISTRIBUTOR":
      return "orders";
    case "RETAILER":
    case "SHOP":
      return "sales";
    default:
      return "sales";
  }
}

function subtitleForOrg(type: OrganizationType | undefined | null): string {
  switch (type) {
    case "MANUFACTURER":
      return "Quote first, then convert accepted quotes into orders when the buyer is ready.";
    case "DISTRIBUTOR":
      return "Orders sit in the middle — reserve stock, invoice, then dispatch.";
    case "RETAILER":
    case "SHOP":
      return "Use Point of sale for the till. This page keeps history, invoices, and returns.";
    default:
      return "A deal from quote to payment — and back again if it returns.";
  }
}

function SalesWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: me } = useCurrentUser();
  const permissions = useCapabilities();
  const orgType = me?.organization?.type;
  const canSell = permissions.can("SELL");
  const counter = isCounterOrg(orgType);

  const defaultTab = useMemo(() => defaultTabForOrg(orgType), [orgType]);
  const [tab, setTab] = useState<string>(() => searchParams.get("tab") ?? defaultTab);
  const [initialized, setInitialized] = useState(() => !!searchParams.get("tab"));

  useEffect(() => {
    const wanted = searchParams.get("tab");
    if (wanted) {
      if (wanted !== tab) setTab(wanted);
      setInitialized(true);
      return;
    }
    if (!initialized && me !== undefined) {
      setTab(defaultTab);
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, me, defaultTab]);

  const select = (next: string) => {
    setTab(next);
    router.replace(`/dashboard/sales?tab=${next}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-success text-white">
            <ShoppingCart className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Sales &amp; orders</h1>
            <p className="text-sm text-muted-foreground">{subtitleForOrg(orgType)}</p>
          </div>
        </div>

        {canSell && (
          <div className="flex flex-wrap items-center gap-2">
            {counter ? (
              <>
                <Button size="sm" nativeButton={false} render={<Link href="/dashboard/sales/pos" />}>
                  <Receipt className="mr-1.5 size-4" /> Open point of sale
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/dashboard/sales/new" />}
                >
                  <Plus className="mr-1.5 size-4" /> Business sale
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" nativeButton={false} render={<Link href="/dashboard/sales/new" />}>
                  <Plus className="mr-1.5 size-4" /> New sale
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/dashboard/sales/pos" />}
                >
                  <Receipt className="mr-1.5 size-4" /> Point of sale
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <Tabs value={tab} onValueChange={select} className="space-y-4">
        <TabsList className="h-auto flex-wrap rounded-xl border border-border/80 bg-muted/50 p-1">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-2">
              <Icon className="size-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="sales">
          <SalesOverviewPanel preferPos={counter} />
        </TabsContent>
        <TabsContent value="quotations">
          <QuotationsPanel />
        </TabsContent>
        <TabsContent value="orders">
          <SalesOrdersPanel />
        </TabsContent>
        <TabsContent value="invoices">
          <InvoicesPanel />
        </TabsContent>
        <TabsContent value="returns">
          <ReturnsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SalesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Loading sales…
        </div>
      }
    >
      <SalesWorkspace />
    </Suspense>
  );
}
