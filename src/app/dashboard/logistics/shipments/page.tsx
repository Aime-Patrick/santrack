"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Truck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShipmentsPanel } from "@/components/logistics-panels/shipments-panel";
import { RoutesPanel } from "@/components/logistics-panels/routes-panel";

/**
 * A shipment travels a route, so the two are read together — dispatching one
 * means picking the other.
 *
 * Retired routes redirect here with ?tab=, so saved links still land where
 * they named.
 */
function ShipmentsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get("tab") ?? "shipments");

  useEffect(() => {
    const wanted = searchParams.get("tab");
    if (wanted && wanted !== tab) setTab(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const select = (next: string) => {
    setTab(next);
    router.replace(`/dashboard/logistics/shipments?tab=${next}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <Truck className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Shipments</h1>
          <p className="text-sm text-muted-foreground">Consignments in motion, and the routes they take.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={select} className="space-y-4">
        <TabsList className="rounded-xl border border-border/80 bg-muted/50 p-1">
          <TabsTrigger value="shipments" className="gap-2">
            <Truck className="size-4" />
            Shipments
          </TabsTrigger>
          <TabsTrigger value="routes" className="gap-2">
            <MapPin className="size-4" />
            Routes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shipments">
          <ShipmentsPanel />
        </TabsContent>
        <TabsContent value="routes">
          <RoutesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ShipmentsWorkspacePage() {
  return (
    <Suspense fallback={null}>
      <ShipmentsWorkspace />
    </Suspense>
  );
}
