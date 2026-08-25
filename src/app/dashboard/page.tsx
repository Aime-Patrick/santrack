"use client";

import { TrendingUp } from "lucide-react";
import { RoleBasedKPIs } from "@/components/dashboard/role-based-kpis";
import { ProductionTrendsChart } from "@/components/dashboard/production-trends-chart";
import { RecentActivities } from "@/components/dashboard/recent-activities";

export default function DashboardPage() {
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

      {/* Role-based KPI Cards */}
      <RoleBasedKPIs />

      {/* Two-panel layout: Chart (60%) + Recent Activities (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ProductionTrendsChart />
        </div>
        <div className="lg:col-span-2">
          <RecentActivities />
        </div>
      </div>
    </div>
  );
}
