"use client";

import { BarChart3, Factory, Package, TrendingUp, Truck, Box } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/stat-card";
import {
  useExecutiveSummary,
  useIndustryCategories,
  useSupplyChainSummary,
} from "@/hooks/analytics";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function AnalyticsPage() {
  const { data: me } = useCurrentUser();
  const isRegulator = me?.organization?.type === "REGULATOR";
  const { data: executive, isLoading: execLoading } = useExecutiveSummary();
  const { data: categories, isLoading: catLoading } = useIndustryCategories({
    enabled: isRegulator,
  });
  const { data: supplyChain, isLoading: scLoading } = useSupplyChainSummary();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <BarChart3 className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Operational insights for this organization.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Licenses"
          value={executive?.compliance?.activeLicenses ?? "—"}
          icon={<Factory className="size-4" />}
          iconBg="bg-primary"
          caption="Compliant permits"
          badge={execLoading ? "Loading" : undefined}
          badgeType="neutral"
        />
        <MetricCard
          title="Available Units"
          value={executive?.supplyChain?.availableUnits ?? "—"}
          icon={<Package className="size-4" />}
          iconBg="bg-success"
          caption="In stock"
        />
        <MetricCard
          title="Distinct Products"
          value={executive?.supplyChain?.distinctProducts ?? "—"}
          icon={<Box className="size-4" />}
          iconBg="bg-primary"
          caption="Tracked products"
        />
        <MetricCard
          title="Revenue"
          value={`RWF ${(executive?.finance?.revenue ?? 0).toLocaleString()}`}
          icon={<TrendingUp className="size-4" />}
          iconBg="bg-warning"
          caption="Total invoiced"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Production Rate</CardTitle>
            <CardDescription>Current output metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40">
              <div className="text-center">
                <TrendingUp className="mx-auto size-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Production chart</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supply Chain</CardTitle>
            <CardDescription>Shipment status overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40">
              <div className="text-center">
                <Truck className="mx-auto size-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Supply chain chart</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock health</CardTitle>
            <CardDescription>Positions and movement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3 text-center">
                <p className="text-xl font-bold">
                  {(supplyChain?.availableUnits ?? 0).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-faint">Available</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3 text-center">
                <p className="text-xl font-bold">
                  {(supplyChain?.inTransitUnits ?? 0).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-faint">In transit</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3 text-center">
                <p className="text-xl font-bold">
                  {supplyChain?.stockOutProducts ?? 0}
                </p>
                <p className="mt-1 text-xs text-faint">Stock-outs</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3 text-center">
                <p className="text-xl font-bold">
                  {supplyChain?.inTransitShipments ?? 0}
                </p>
                <p className="mt-1 text-xs text-faint">Shipments moving</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isRegulator && (
        <Card>
          <CardHeader>
            <CardTitle>Industry Summary</CardTitle>
            <CardDescription>
              {categories?.length ?? 0} organization types
            </CardDescription>
          </CardHeader>
          <CardContent>
            {catLoading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                Loading industry data...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories?.map((cat) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{cat.category}</p>
                      <p className="text-xs text-faint">
                        {cat.count} organizations
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        {cat.totalEmployees}
                      </p>
                      <p className="text-[10px] text-faint">employees</p>
                    </div>
                  </div>
                ))}
                {(!categories || categories.length === 0) && (
                  <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                    No industry data available.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Supply Chain Metrics</CardTitle>
          <CardDescription>Current movement pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          {scLoading ? (
            <div className="flex h-24 items-center justify-center text-muted-foreground">
              Loading supply chain data...
            </div>
          ) : supplyChain ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {(supplyChain.availableUnits ?? 0).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-faint">Available units</p>
              </div>
              <div className="rounded-lg border border-warning/30 bg-amber-50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-warning-foreground">
                  {(supplyChain.inTransitUnits ?? 0).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-faint">Units in transit</p>
              </div>
              <div className="rounded-lg border border-success/30 bg-emerald-50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-success">
                  {supplyChain.inTransitShipments ?? 0}
                </p>
                <p className="mt-1 text-xs text-faint">Active shipments</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {supplyChain.distributionVolumes ?? 0}
                </p>
                <p className="mt-1 text-xs text-faint">Received transfers</p>
              </div>
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No supply chain data available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
