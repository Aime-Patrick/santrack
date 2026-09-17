"use client";

import { TrendingUp, Warehouse, Store, Factory } from "lucide-react";
import { RoleBasedKPIs } from "@/components/dashboard/role-based-kpis";
import { ProductionTrendsChart } from "@/components/dashboard/production-trends-chart";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { ContinueWork } from "@/components/dashboard/continue-work";
import { PlatformDashboard } from "@/components/dashboard/platform-dashboard";
import { RegulatorDashboard } from "@/components/dashboard/regulator-dashboard";
import { OversightDashboard } from "@/components/dashboard/oversight-dashboard";
import { useRegulatoryOversightSummary } from "@/hooks/regulatory-oversight";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { OrganizationType } from "@/lib/api";

function homeCopy(type: OrganizationType | undefined | null): {
  title: string;
  subtitle: string;
  icon: typeof TrendingUp;
} {
  switch (type) {
    case "WAREHOUSE":
      return {
        title: "Warehouse dashboard",
        subtitle: "Stock positions, inbound receipts, and outbound dispatches.",
        icon: Warehouse,
      };
    case "RETAILER":
      return {
        title: "Retail dashboard",
        subtitle: "Sales, stock on hand, and licence standing for this store.",
        icon: Store,
      };
    case "DISTRIBUTOR":
      return {
        title: "Distribution dashboard",
        subtitle: "Wholesale orders, transfers, and stock moving through the chain.",
        icon: Warehouse,
      };
    case "MANUFACTURER":
      return {
        title: "Manufacturing dashboard",
        subtitle: "Production, inventory, and traceability for this plant.",
        icon: Factory,
      };
    default:
      return {
        title: "Operations dashboard",
        subtitle: "Live overview of this organization's operations and records.",
        icon: TrendingUp,
      };
  }
}

export default function DashboardPage() {
  const { data: me, isLoading } = useCurrentUser();
  const oversight = useRegulatoryOversightSummary(me?.organization?.type === "REGULATOR");

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Loading dashboard…
      </div>
    );
  }

  // Platform operator has no organization — org analytics would 400.
  if (me?.role === "SYSTEM_ADMIN" && !me.organization) {
    return <PlatformDashboard />;
  }

  if (me?.organization?.type === "REGULATOR") {
    if (oversight.data) return <OversightDashboard />;
    return <RegulatorDashboard />;
  }

  const copy = homeCopy(me?.organization?.type);
  const Icon = copy.icon;
  const orgType = me?.organization?.type;
  const stackChartAndActivity = orgType === "RETAILER" || orgType === "SHOP";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <Icon className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>
      </div>

      {/* Actions first — numbers second. People open this page to do work. */}
      <ContinueWork />

      <RoleBasedKPIs />

      {stackChartAndActivity ? (
        <div className="flex flex-col gap-6">
          <ProductionTrendsChart />
          <RecentActivities />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ProductionTrendsChart />
          </div>
          <div className="lg:col-span-2">
            <RecentActivities />
          </div>
        </div>
      )}
    </div>
  );
}
