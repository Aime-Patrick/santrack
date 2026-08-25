"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ClipboardList,
  FileText,
  Receipt,
  RotateCcw,
  ShoppingCart,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesOverviewPanel } from "@/components/sales/sales-overview-panel";
import { QuotationsPanel } from "@/components/sales/quotations-panel";
import { SalesOrdersPanel } from "@/components/sales/sales-orders-panel";
import { InvoicesPanel } from "@/components/sales/invoices-panel";
import { ReturnsPanel } from "@/components/sales/returns-panel";

/**
 * The commercial pipeline, on one screen.
 *
 * Quotation, order, invoice and return are four stages of one document moving
 * through its life, not four separate places. As four sidebar entries they read
 * as unrelated, so somebody chasing one deal had to remember which menu held
 * the stage it had reached — and the menu gave no hint that they were the same
 * deal at all.
 *
 * The tab order is the order the work happens in. It is the only ordering that
 * carries information here, so it is the one used.
 */
const TABS = [
  { value: "sales", label: "Sales", icon: ShoppingCart },
  { value: "quotations", label: "Quotations", icon: Receipt },
  { value: "orders", label: "Orders", icon: ClipboardList },
  { value: "invoices", label: "Invoices", icon: FileText },
  { value: "returns", label: "Returns", icon: RotateCcw },
] as const;

function SalesWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get("tab") ?? "sales");

  // The retired /sales/orders, /sales/invoices and friends redirect here with
  // ?tab=, so a saved link still opens the stage it named.
  useEffect(() => {
    const wanted = searchParams.get("tab");
    if (wanted && wanted !== tab) setTab(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /**
   * The tab is mirrored into the URL so a stage stays linkable and survives a
   * refresh. `replace` rather than `push`: flipping between tabs is looking
   * around one screen, and filling the back button with it would mean Back
   * walks the tabs instead of leaving the screen.
   */
  const select = (next: string) => {
    setTab(next);
    router.replace(`/dashboard/sales?tab=${next}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-success text-white">
          <ShoppingCart className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Sales &amp; Orders</h1>
          <p className="text-sm text-muted-foreground">
            A deal from quote to payment, and back again if it returns.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={select} className="space-y-4">
        <TabsList className="rounded-xl border border-border/80 bg-muted/50 p-1">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-2">
              <Icon className="size-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/*
          Each panel mounts only while its tab is open. Every one of them runs
          its own queries, and mounting all five at once would fire five list
          requests to open a screen where four of the answers are not on view.
        */}
        <TabsContent value="sales">
          <SalesOverviewPanel />
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

/**
 * useSearchParams needs a Suspense boundary above it, or the whole route opts
 * out of static rendering and Next fails the build.
 */
export default function SalesPage() {
  return (
    <Suspense fallback={null}>
      <SalesWorkspace />
    </Suspense>
  );
}
