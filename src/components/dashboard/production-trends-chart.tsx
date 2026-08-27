"use client";

import * as React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useProductionTrend } from "@/hooks/analytics";
import { useCurrentUser } from "@/hooks/use-current-user";

export function ProductionTrendsChart() {
  const [timeRange, setTimeRange] = React.useState<"3m" | "30d" | "7d">("3m");
  const { data: trendData, isLoading } = useProductionTrend();
  const { data: me } = useCurrentUser();
  const orgType = me?.organization?.type;

  const title =
    orgType === "MANUFACTURER"
      ? "Production & Traceability Output"
      : "Operational volume";
  const subtitle =
    orgType === "MANUFACTURER"
      ? "Plant output volume (units / batches)"
      : orgType === "WAREHOUSE"
        ? "Warehouse throughput over time"
        : orgType === "RETAILER"
          ? "Store activity over time"
          : "Organization volume over time";

  const filterTabs = [
    { key: "3m" as const, label: "Last 3 months" },
    { key: "30d" as const, label: "Last 30 days" },
    { key: "7d" as const, label: "Last 7 days" },
  ];

  const chartData = React.useMemo(() => {
    if (!trendData) return [];
    const now = new Date();
    let daysBack = 90;
    if (timeRange === "30d") daysBack = 30;
    if (timeRange === "7d") daysBack = 7;

    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - daysBack);

    return trendData
      .filter((d) => new Date(d.date) >= cutoff)
      .map((d) => ({
        date: d.label,
        production: d.produced,
        target: d.target,
      }));
  }, [trendData, timeRange]);

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="flex flex-col gap-4 p-5 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex items-center self-start rounded-lg border border-border/80 bg-muted/40 p-0.5 sm:self-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTimeRange(tab.key)}
              className={cn(
                "cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors",
                timeRange === tab.key
                  ? "bg-background font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        <div className="h-[280px] w-full">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading data...
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No volume data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#067eda" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#067eda" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00953C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00953C" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#8994A3" }}
                  dy={10}
                  interval="preserveStartEnd"
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#8994A3" }}
                  dx={-10}
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border border-border bg-background p-2.5 text-xs shadow-md">
                          <p className="mb-1 font-semibold text-foreground">
                            {payload[0]?.payload?.date}
                          </p>
                          <div className="flex items-center justify-between gap-4 text-primary">
                            <span>Output:</span>
                            <span className="font-bold">{payload[0]?.value}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-[#00953C]">
                            <span>Baseline:</span>
                            <span className="font-medium">{payload[1]?.value}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="production"
                  stroke="#067eda"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorProd)"
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="#00953C"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTarget)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
