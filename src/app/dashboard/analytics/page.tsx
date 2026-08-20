"use client";

import { BarChart3, Factory, Package, Users, TrendingUp, Truck, Box } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useExecutiveSummary, useIndustryCategories, useSupplyChainSummary } from "@/hooks/analytics";

export default function AnalyticsPage() {
  const { data: executive, isLoading: execLoading } = useExecutiveSummary();
  const { data: categories, isLoading: catLoading } = useIndustryCategories();
  const { data: supplyChain, isLoading: scLoading } = useSupplyChainSummary();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <BarChart3 className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Executive intelligence and operational insights.</p>
        </div>
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Licensed Industries"
          value={executive?.industry?.licensedIndustries ?? "—"}
          icon={<Factory className="size-4" />}
          iconBg="bg-primary"
          caption="Active license categories"
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

      {/* Production & Supply Chain */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Production Rate</CardTitle>
            <CardDescription>Current output metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40 rounded-lg bg-muted/40 border border-dashed border-border">
              <div className="text-center">
                <TrendingUp className="size-8 text-muted-foreground/50 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Production chart</p>
                <p className="text-xs text-faint">Recharts line chart will render here</p>
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
            <div className="flex items-center justify-center h-40 rounded-lg bg-muted/40 border border-dashed border-border">
              <div className="text-center">
                <Truck className="size-8 text-muted-foreground/50 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Supply chain chart</p>
                <p className="text-xs text-faint">Recharts donut chart will render here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Industries by Category</CardTitle>
            <CardDescription>Distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40 rounded-lg bg-muted/40 border border-dashed border-border">
              <div className="text-center">
                <Factory className="size-8 text-muted-foreground/50 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Category breakdown</p>
                <p className="text-xs text-faint">Recharts pie chart will render here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Industry Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Industry Summary</CardTitle>
          <CardDescription>{categories?.length ?? 0} organization types</CardDescription>
        </CardHeader>
        <CardContent>
          {catLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading industry data...</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories?.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{cat.category}</p>
                    <p className="text-xs text-faint">{cat.count} organizations</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{cat.totalEmployees}</p>
                    <p className="text-[10px] text-faint">employees</p>
                  </div>
                </div>
              ))}
              {(!categories || categories.length === 0) && (
                <p className="text-sm text-muted-foreground col-span-full text-center py-8">No industry data available.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supply Chain Details */}
      <Card>
        <CardHeader>
          <CardTitle>Supply Chain Metrics</CardTitle>
          <CardDescription>Current shipment pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          {scLoading ? (
            <div className="flex h-24 items-center justify-center text-muted-foreground">Loading supply chain data...</div>
          ) : supplyChain ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-foreground">{supplyChain.pendingShipments}</p>
                <p className="text-xs text-faint mt-1">Pending Shipments</p>
              </div>
              <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-warning-foreground">{supplyChain.inTransit}</p>
                <p className="text-xs text-faint mt-1">In Transit</p>
              </div>
              <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-success">{supplyChain.delivered}</p>
                <p className="text-xs text-faint mt-1">Delivered</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-foreground">{supplyChain.totalValue.toLocaleString()}</p>
                <p className="text-xs text-faint mt-1">Total Value</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No supply chain data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
