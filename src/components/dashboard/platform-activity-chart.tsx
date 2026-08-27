"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { AuditEntry } from "@/services/audit.service";

type DayPoint = {
  key: string;
  label: string;
  total: number;
  success: number;
  errors: number;
};

const SERIES = {
  total: { label: "Total writes", color: "#067eda" },
  success: { label: "Success (2xx)", color: "#00953C" },
  errors: { label: "Errors (4xx+)", color: "#E11D48" },
} as const;

function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function lastNDays(n: number): DayPoint[] {
  const days: DayPoint[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({
      key: localDayKey(d),
      label: d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      total: 0,
      success: 0,
      errors: 0,
    });
  }
  return days;
}

/**
 * Platform activity from the audit footprint — last 14 days as colored lines.
 */
export function PlatformActivityChart({
  entries,
  isLoading,
}: {
  entries: AuditEntry[];
  isLoading?: boolean;
}) {
  const chartData = useMemo(() => {
    const days = lastNDays(14);
    const byKey = new Map(days.map((d) => [d.key, d]));
    for (const entry of entries) {
      const key = localDayKey(new Date(entry.performedAt));
      const bucket = byKey.get(key);
      if (!bucket) continue;
      bucket.total += 1;
      if (entry.statusCode >= 200 && entry.statusCode < 300) {
        bucket.success += 1;
      } else if (entry.statusCode >= 400) {
        bucket.errors += 1;
      }
    }
    return days;
  }, [entries]);

  return (
    <Card className="h-full border border-border/80 bg-card shadow-xs">
      <CardHeader className="space-y-1 p-5 pb-2">
        <h3 className="text-base font-semibold text-foreground">
          Platform activity
        </h3>
        <p className="text-xs text-muted-foreground">
          Audit footprint by day · last 14 days
        </p>
      </CardHeader>
      <CardContent className="p-5 pt-2">
        <div className="h-[340px] w-full">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading activity…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#8994A3" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#8994A3" }}
                  width={28}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0]?.payload as DayPoint;
                    return (
                      <div className="rounded-lg border border-border bg-background p-2.5 text-xs shadow-md">
                        <p className="mb-1.5 font-semibold">{row.label}</p>
                        <div className="space-y-1">
                          <p style={{ color: SERIES.total.color }}>
                            {SERIES.total.label}: {row.total}
                          </p>
                          <p style={{ color: SERIES.success.color }}>
                            {SERIES.success.label}: {row.success}
                          </p>
                          <p style={{ color: SERIES.errors.color }}>
                            {SERIES.errors.label}: {row.errors}
                          </p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={28}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingBottom: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name={SERIES.total.label}
                  stroke={SERIES.total.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="success"
                  name={SERIES.success.label}
                  stroke={SERIES.success.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="errors"
                  name={SERIES.errors.label}
                  stroke={SERIES.errors.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
