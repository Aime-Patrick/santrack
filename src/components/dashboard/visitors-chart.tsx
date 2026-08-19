"use client";

import * as React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const chartData3Months = [
  { date: "Apr 3", current: 220, previous: 140 },
  { date: "Apr 6", current: 340, previous: 200 },
  { date: "Apr 10", current: 280, previous: 160 },
  { date: "Apr 14", current: 420, previous: 260 },
  { date: "Apr 18", current: 310, previous: 190 },
  { date: "Apr 22", current: 490, previous: 300 },
  { date: "Apr 26", current: 360, previous: 210 },
  { date: "Apr 30", current: 540, previous: 330 },
  { date: "May 4", current: 410, previous: 250 },
  { date: "May 8", current: 620, previous: 380 },
  { date: "May 12", current: 480, previous: 290 },
  { date: "May 16", current: 670, previous: 410 },
  { date: "May 20", current: 510, previous: 320 },
  { date: "May 24", current: 430, previous: 270 },
  { date: "May 28", current: 590, previous: 360 },
  { date: "Jun 1", current: 460, previous: 280 },
  { date: "Jun 5", current: 640, previous: 390 },
  { date: "Jun 9", current: 520, previous: 310 },
  { date: "Jun 13", current: 710, previous: 440 },
  { date: "Jun 17", current: 560, previous: 350 },
  { date: "Jun 21", current: 780, previous: 490 },
  { date: "Jun 25", current: 610, previous: 380 },
  { date: "Jun 30", current: 820, previous: 520 },
];

export function VisitorsChart() {
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
          <h3 className="text-base font-semibold text-foreground">Total Visitors</h3>
          <p className="text-xs text-muted-foreground">Total for the last 3 months</p>
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
            <AreaChart data={chartData3Months} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#334155" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#334155" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                dy={10}
                interval="preserveStartEnd"
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border border-border bg-background p-2.5 shadow-md text-xs">
                        <p className="font-semibold text-foreground mb-1">{payload[0]?.payload?.date}</p>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Current:</span>
                          <span className="font-medium text-foreground">{payload[0]?.value}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Previous:</span>
                          <span className="font-medium text-muted-foreground">{payload[1]?.value}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey="current"
                stroke="#1e293b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCurrent)"
              />
              <Area
                type="monotone"
                dataKey="previous"
                stroke="#64748b"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorPrevious)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
