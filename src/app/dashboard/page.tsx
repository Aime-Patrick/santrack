"use client";

import { Building2, Package, TrendingUp, Users, ShoppingCart, Truck } from "lucide-react";
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Industries"
          value={isLoading ? "—" : summary?.totalIndustries ?? 0}
          icon={<Building2 className="size-4" />}
          iconBg="bg-primary"
          caption="Registered organizations"
        />
        <MetricCard
          title="Inventory Items"
          value={isLoading ? "—" : (summary?.totalItems ?? 0).toLocaleString()}
          icon={<Package className="size-4" />}
          iconBg="bg-success"
          caption="Stock tracked in real-time"
        />
        <MetricCard
          title="Production Rate"
          value={isLoading ? "—" : `${summary?.productionRate ?? 0}%`}
          icon={<TrendingUp className="size-4" />}
          iconBg="bg-warning-foreground"
          caption="Operational efficiency"
        />
        <MetricCard
          title="Active Workforce"
          value={isLoading ? "—" : summary?.activeWorkforce ?? 0}
          icon={<Users className="size-4" />}
          iconBg="bg-primary"
          caption="Certified operators"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Recent Sales"
          value={isLoading ? "—" : summary?.recentSales ?? 0}
          icon={<ShoppingCart className="size-4" />}
          iconBg="bg-success"
          caption="Last 30 days"
        />
        <MetricCard
          title="Active Products"
          value={isLoading ? "—" : summary?.totalProducts ?? 0}
          icon={<Package className="size-4" />}
          iconBg="bg-primary"
          caption="Registered in catalog"
        />
        <MetricCard
          title="Pending Transfers"
          value={isLoading ? "—" : summary?.pendingTransfers ?? 0}
          icon={<Truck className="size-4" />}
          iconBg="bg-warning-foreground"
          caption="Awaiting dispatch"
        />
      </div>

      {/* Chart */}
      <ProductionTrendsChart />

      {/* Operations Table */}
      <OperationsTable />
    </div>
  );
}
