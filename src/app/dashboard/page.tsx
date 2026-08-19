import { Building2, Package, TrendingUp, Users } from "lucide-react";
import { MetricCard } from "@/components/dashboard/stat-card";
import { ProductionTrendsChart } from "@/components/dashboard/production-trends-chart";
import { OperationsTable } from "@/components/dashboard/operations-table";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome header */}
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

      {/* ── Top 4 KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Industries"
          value="24"
          badge="+12.5%"
          badgeType="positive"
          trendText="Trending up this month"
          trendType="up"
          caption="Registered across 5 economic zones"
          icon={<Building2 className="size-4" />}
          iconBg="bg-primary"
        />

        <MetricCard
          title="Inventory Items"
          value="1,482"
          badge="+8.4%"
          badgeType="positive"
          trendText="Active catalog batches"
          trendType="up"
          caption="Stock tracked in real-time"
          icon={<Package className="size-4" />}
          iconBg="bg-success"
        />

        <MetricCard
          title="Production Rate"
          value="85.6%"
          badge="+5.2%"
          badgeType="positive"
          trendText="Daily output target met"
          trendType="up"
          caption="National operational efficiency"
          icon={<TrendingUp className="size-4" />}
          iconBg="bg-warning-foreground"
        />

        <MetricCard
          title="Active Workforce"
          value="348"
          badge="+4.5%"
          badgeType="positive"
          trendText="Certified plant operators"
          trendType="up"
          caption="Across registered factories"
          icon={<Users className="size-4" />}
          iconBg="bg-primary"
        />
      </div>

      {/* ── Production & Traceability Trends Chart ── */}
      <ProductionTrendsChart />

      {/* ── Operations & Batches Table ── */}
      <OperationsTable />
    </div>
  );
}
