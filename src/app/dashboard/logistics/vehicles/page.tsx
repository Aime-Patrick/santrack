"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehiclesPanel } from "@/components/logistics-panels/vehicles-panel";
import { DriversPanel } from "@/components/logistics-panels/drivers-panel";
import { TransportersPanel } from "@/components/logistics-panels/transporters-panel";

/**
 * Vehicles, drivers and transporters are one answer to "who can carry this?".
 * Assigning a shipment needs all three at once, so they belong on one screen
 * rather than three menu entries.
 *
 * Retired routes redirect here with ?tab=, so saved links still land where
 * they named.
 */
function FleetWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get("tab") ?? "vehicles");

  useEffect(() => {
    const wanted = searchParams.get("tab");
    if (wanted && wanted !== tab) setTab(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const select = (next: string) => {
    setTab(next);
    router.replace(`/dashboard/logistics/vehicles?tab=${next}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Truck className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Fleet &amp; transporters</h1>
            <p className="text-sm text-muted-foreground">
              What moves the goods, who drives it, and which carrier owns it.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/dashboard/logistics/shipments" />}
        >
          Shipments &amp; routes
        </Button>
      </div>

      <Tabs value={tab} onValueChange={select} className="space-y-4">
        <TabsList className="rounded-xl border border-border/80 bg-muted/50 p-1">
          <TabsTrigger value="vehicles" className="gap-2">
            <Truck className="size-4" />
            Vehicles
          </TabsTrigger>
          <TabsTrigger value="drivers" className="gap-2">
            <Users className="size-4" />
            Drivers
          </TabsTrigger>
          <TabsTrigger value="transporters" className="gap-2">
            <Building2 className="size-4" />
            Transporters
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles">
          <VehiclesPanel />
        </TabsContent>
        <TabsContent value="drivers">
          <DriversPanel />
        </TabsContent>
        <TabsContent value="transporters">
          <TransportersPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function FleetPage() {
  return (
    <Suspense fallback={null}>
      <FleetWorkspace />
    </Suspense>
  );
}
