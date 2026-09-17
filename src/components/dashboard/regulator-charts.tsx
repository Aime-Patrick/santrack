"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { License } from "@/lib/api";
import type { RegulatoryCommandSummary } from "@/services/regulatory-command.service";
import type { ComplianceFindingRow } from "@/services/license.service";

const COLORS = {
  primary: "#067eda",
  success: "#00953C",
  warning: "#d97706",
  danger: "#C62828",
  info: "#00A1DE",
  muted: "#8994A3",
  gold: "#c9a227",
};

const ACTIVITY_LABELS: Record<string, string> = {
  MANUFACTURING: "Manufacturing",
  WAREHOUSING: "Warehousing",
  DISTRIBUTION: "Distribution",
  RETAIL: "Retail",
  REGULATION: "Regulation",
};

const ACTIVITY_COLORS: Record<string, string> = {
  MANUFACTURING: COLORS.primary,
  WAREHOUSING: COLORS.success,
  DISTRIBUTION: COLORS.gold,
  RETAIL: COLORS.danger,
  REGULATION: COLORS.muted,
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  CHANGES_REQUESTED: "Changes requested",
};

type Props = {
  command?: RegulatoryCommandSummary;
  queue?: License[];
  findings?: ComplianceFindingRow[];
  loading?: boolean;
};

export function RegulatorCharts({ command, queue, findings, loading }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <AttentionLoadChart command={command} queueCount={queue?.length ?? 0} findingsCount={findings?.length ?? 0} loading={loading} />
      </div>
      <div className="lg:col-span-2">
        <QueueMixChart queue={queue} loading={loading} />
      </div>
      <div className="lg:col-span-5">
        <FindingsTrendChart findings={findings} loading={loading} />
      </div>
    </div>
  );
}

function AttentionLoadChart({
  command,
  queueCount,
  findingsCount,
  loading,
}: {
  command?: RegulatoryCommandSummary;
  queueCount: number;
  findingsCount: number;
  loading?: boolean;
}) {
  const data = useMemo(
    () => [
      { key: "queue", label: "Licence queue", value: queueCount, fill: COLORS.warning },
      { key: "overdue", label: "Overdue cases", value: command?.overdueCases ?? 0, fill: COLORS.danger },
      { key: "unassigned", label: "Unassigned", value: command?.unassignedCases ?? 0, fill: COLORS.gold },
      { key: "recalls", label: "Active recalls", value: command?.activeRecalls ?? 0, fill: COLORS.primary },
      { key: "reports", label: "Market reports", value: command?.marketReportsToTriage ?? 0, fill: COLORS.info },
      { key: "findings", label: "Findings", value: findingsCount, fill: COLORS.success },
      { key: "inspections", label: "Inspections today", value: command?.inspectionsToday ?? 0, fill: COLORS.muted },
    ],
    [command, queueCount, findingsCount],
  );

  const total = data.reduce((sum, row) => sum + row.value, 0);
  const config = Object.fromEntries(
    data.map((row) => [row.key, { label: row.label, color: row.fill }]),
  ) satisfies ChartConfig;

  return (
    <Card className="border border-border/80 shadow-xs">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Attention load</CardTitle>
        <CardDescription>
          What is waiting on this authority right now
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <EmptyChart label="Loading workload…" />
        ) : total === 0 ? (
          <EmptyChart label="No open workload to chart yet" />
        ) : (
          <ChartContainer config={config} className="h-[260px] w-full">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-18}
                textAnchor="end"
                height={56}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={28} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={36}>
                {data.map((row) => (
                  <Cell key={row.key} fill={row.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function QueueMixChart({
  queue,
  loading,
}: {
  queue?: License[];
  loading?: boolean;
}) {
  const { slices, config, total } = useMemo(() => {
    const items = queue ?? [];
    const counts = new Map<string, number>();
    for (const license of items) {
      const key = license.activity || "OTHER";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const slices = [...counts.entries()].map(([activity, value]) => ({
      activity,
      label: ACTIVITY_LABELS[activity] ?? activity,
      value,
      fill: ACTIVITY_COLORS[activity] ?? COLORS.muted,
    }));
    const config = Object.fromEntries(
      slices.map((row) => [row.activity, { label: row.label, color: row.fill }]),
    ) satisfies ChartConfig;
    return { slices, config, total: items.length };
  }, [queue]);

  const statusFallback = useMemo(() => {
    const items = queue ?? [];
    const counts = new Map<string, number>();
    for (const license of items) {
      counts.set(license.status, (counts.get(license.status) ?? 0) + 1);
    }
    return [...counts.entries()].map(([status, value]) => ({
      label: STATUS_LABELS[status] ?? status,
      value,
    }));
  }, [queue]);

  return (
    <Card className="border border-border/80 shadow-xs">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">Licence queue mix</CardTitle>
          <CardDescription>Applications waiting by activity</CardDescription>
        </div>
        <Button variant="outline" size="sm" render={<Link href="/dashboard/regulator" />}>
          Review
          <ArrowRight className="ml-1.5 size-3.5" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <EmptyChart label="Loading queue…" />
        ) : total === 0 ? (
          <EmptyChart label="Queue is empty — nothing to decide" />
        ) : (
          <div className="flex min-w-0 items-center gap-4">
            <ChartContainer config={config} className="h-[220px] w-[180px] shrink-0">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, name) => [`${value}`, String(name)]}
                    />
                  }
                />
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                  strokeWidth={2}
                >
                  {slices.map((row) => (
                    <Cell key={row.activity} fill={row.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="min-w-0 flex-1 space-y-2">
              {slices.map((row) => (
                <li key={row.activity} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.fill }} />
                    <span className="truncate">{row.label}</span>
                  </span>
                  <span className="font-semibold tabular-nums">{row.value}</span>
                </li>
              ))}
              {statusFallback.length > 1 ? (
                <li className="pt-1 text-[13px] text-muted-foreground">
                  {statusFallback.map((row) => `${row.label} ${row.value}`).join(" · ")}
                </li>
              ) : null}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FindingsTrendChart({
  findings,
  loading,
}: {
  findings?: ComplianceFindingRow[];
  loading?: boolean;
}) {
  const data = useMemo(() => {
    const days = 14;
    const buckets = new Map<string, number>();
    const labels: { key: string; label: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      buckets.set(key, 0);
      labels.push({
        key,
        label: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      });
    }

    for (const finding of findings ?? []) {
      const key = new Date(finding.recordedAt).toISOString().slice(0, 10);
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
    }

    return labels.map((row) => ({
      date: row.label,
      findings: buckets.get(row.key) ?? 0,
    }));
  }, [findings]);

  const total = data.reduce((sum, row) => sum + row.findings, 0);
  const config = {
    findings: { label: "Findings", color: COLORS.danger },
  } satisfies ChartConfig;

  return (
    <Card className="border border-border/80 shadow-xs">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">Compliance findings</CardTitle>
          <CardDescription>Signals recorded in the last 14 days</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/dashboard/compliance/findings" />}
        >
          Findings
          <ArrowRight className="ml-1.5 size-3.5" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <EmptyChart label="Loading findings…" />
        ) : total === 0 ? (
          <EmptyChart label="No findings in the last 14 days" />
        ) : (
          <ChartContainer config={config} className="h-[220px] w-full">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="findingsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="findings"
                stroke={COLORS.danger}
                strokeWidth={2.25}
                fill="url(#findingsFill)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
      {label}
    </div>
  );
}
