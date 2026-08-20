"use client";

import { Building2, Package, TrendingUp, Users, ShoppingCart, Truck, AlertTriangle, DollarSign } from "lucide-react";
import { MetricCard } from "@/components/dashboard/stat-card";
import { ProductionTrendsChart } from "@/components/dashboard/production-trends-chart";
import { OperationsTable } from "@/components/dashboard/operations-table";
import { useExecutiveSummary } from "@/hooks/analytics";

export default function DashboardPage() {
  const { data: summary, isLoading } = useExecutiveSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <TrendingUp className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">National Industrial Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time overview of Rwanda&apos;s industrial operations and supply chain traceability.
          </p>
        </div>
      </div>

      {/* KPI Cards — Row 1 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Licensed Industries"
          value={isLoading ? "—" : summary?.industry?.licensedIndustries ?? 0}
          icon={<Building2 className="size-4" />}
          iconBg="bg-primary"
          caption="Active licenses"
        />
        <MetricCard
          title="Available Units"
          value={isLoading ? "—" : (summary?.supplyChain?.availableUnits ?? 0).toLocaleString()}
          icon={<Package className="size-4" />}
          iconBg="bg-success"
          caption="In stock"
        />
        <MetricCard
          title="Revenue"
          value={isLoading ? "—" : `RWF ${(summary?.finance?.revenue ?? 0).toLocaleString()}`}
          icon={<DollarSign className="size-4" />}
          iconBg="bg-warning-foreground"
          caption="Total invoiced"
        />
        <MetricCard
          title="Active Workforce"
          value={isLoading ? "—" : summary?.finance?.openInvoices ?? 0}
          icon={<Users className="size-4" />}
          iconBg="bg-primary"
          caption="Open invoices"
        />
      </div>

      {/* KPI Cards — Row 2 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Products Sold"
          value={isLoading ? "—" : summary?.market?.productsSold ?? 0}
          icon={<ShoppingCart className="size-4" />}
          iconBg="bg-success"
          caption="Units sold"
        />
        <MetricCard
          title="In Transit"
          value={isLoading ? "—" : summary?.supplyChain?.inTransitUnits ?? 0}
          icon={<Truck className="size-4" />}
          iconBg="bg-primary"
          caption={`${summary?.supplyChain?.inTransitShipments ?? 0} shipments`}
        />
        <MetricCard
          title="Compliance"
          value={isLoading ? "—" : summary?.compliance?.activeLicenses ?? 0}
          icon={<AlertTriangle className="size-4" />}
          iconBg="bg-warning-foreground"
          caption={`${summary?.compliance?.pendingReviews ?? 0} pending reviews`}
        />
      </div>

      {/* Chart */}
      <ProductionTrendsChart />

      {/* Operations Table */}
      <OperationsTable />
    </div>
  );
}
