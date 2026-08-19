"use client";

import * as React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const chartData = [
  { date: "Apr 3", production: 62, target: 50 },
  { date: "Apr 6", production: 68, target: 52 },
  { date: "Apr 10", production: 65, target: 55 },
  { date: "Apr 14", production: 74, target: 58 },
  { date: "Apr 18", production: 70, target: 60 },
  { date: "Apr 22", production: 82, target: 62 },
  { date: "Apr 26", production: 76, target: 65 },
  { date: "Apr 30", production: 88, target: 68 },
  { date: "May 4", production: 80, target: 70 },
  { date: "May 8", production: 92, target: 72 },
  { date: "May 12", production: 85, target: 74 },
  { date: "May 16", production: 94, target: 75 },
  { date: "May 20", production: 88, target: 76 },
  { date: "May 24", production: 82, target: 78 },
  { date: "May 28", production: 91, target: 80 },
  { date: "Jun 1", production: 86, target: 80 },
  { date: "Jun 5", production: 95, target: 82 },
  { date: "Jun 9", production: 89, target: 84 },
  { date: "Jun 13", production: 98, target: 85 },
  { date: "Jun 17", production: 92, target: 85 },
  { date: "Jun 21", production: 104, target: 88 },
  { date: "Jun 25", production: 96, target: 88 },
  { date: "Jun 30", production: 110, target: 90 },
];

export function ProductionTrendsChart() {
  const [timeRange, setTimeRange] = React.useState<"3m" | "30d" | "7d">("3m");

  const filterTabs = [
    { key: "3m" as const, label: "Last 3 months" },
    { key: "30d" as const, label: "Last 30 days" },
    { key: "7d" as const, label: "Last 7 days" },
  ];

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 pb-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Production & Traceability Output</h3>
          <p className="text-xs text-muted-foreground">National industrial output volume (Tons / Batches)</p>
        </div>

        {/* Time range toggle tabs */}
        <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5 self-start sm:self-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTimeRange(tab.key)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                timeRange === tab.key
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        <div className="h-[280px] w-full">
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
                      <div className="rounded-lg border border-border bg-background p-2.5 shadow-md text-xs">
                        <p className="font-semibold text-foreground mb-1">{payload[0]?.payload?.date}</p>
                        <div className="flex items-center justify-between gap-4 text-primary">
                          <span>Output:</span>
                          <span className="font-bold">{payload[0]?.value}k Tons</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-[#00953C]">
                          <span>Baseline:</span>
                          <span className="font-medium">{payload[1]?.value}k Tons</span>
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
        </div>
      </CardContent>
    </Card>
  );
}
