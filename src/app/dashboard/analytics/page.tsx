"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  BarChart3,
  Factory,
  Package,
  TrendingUp,
  Truck,
  Box,
  ScanLine,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  ShoppingCart,
  Building2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/stat-card";
import {
  useExecutiveSummary,
  useIndustryCategories,
  useSupplyChainSummary,
  useProductionTrend,
} from "@/hooks/analytics";
import { useCurrentUser } from "@/hooks/use-current-user";

// ─── Colour tokens that stay consistent across charts ────────────────────────

const CHART_COLORS = {
  primary: "#067eda",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  muted: "#94a3b8",
};

const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
  "#8b5cf6",
  "#06b6d4",
];

// ─── Shared tooltip style ─────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/80 bg-white px-3 py-2 shadow-lg text-xs">
      {label && <p className="font-bold text-foreground mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5">
          <span
            className="inline-block size-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">
            {p.value.toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Production trend chart ────────────────────────────────────────────────────

function ProductionTrendChart() {
  const { data: trend, isLoading } = useProductionTrend();

  const data = React.useMemo(
    () =>
      (trend ?? []).slice(-30).map((d) => ({
        date: d.label,
        Produced: d.produced,
        Target: d.target,
      })),
    [trend]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Production Output</CardTitle>
        <CardDescription>Units produced vs target — last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No production data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gradProduced" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.muted} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={CHART_COLORS.muted} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="Target"
                stroke={CHART_COLORS.muted}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="url(#gradTarget)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="Produced"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                fill="url(#gradProduced)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Supply chain bar chart ────────────────────────────────────────────────────

function SupplyChainChart({ sc }: { sc: ReturnType<typeof useSupplyChainSummary>["data"] }) {
  const data = [
    { label: "Available", value: sc?.availableUnits ?? 0, color: CHART_COLORS.success },
    { label: "In Transit", value: sc?.inTransitUnits ?? 0, color: CHART_COLORS.warning },
    { label: "Stock-outs", value: sc?.stockOutProducts ?? 0, color: CHART_COLORS.danger },
    { label: "Shipments", value: sc?.inTransitShipments ?? 0, color: CHART_COLORS.primary },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Supply Chain Overview</CardTitle>
        <CardDescription>Current stock movement pipeline</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "#f1f5f9" }}
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload?.map((p) => ({
                    name: String(p.dataKey ?? ""),
                    value: Number(p.value ?? 0),
                    color: String(p.fill ?? CHART_COLORS.primary),
                  }))}
                  label={label ?? undefined}
                />
              )}
            />
            {data.map((d) => (
              <Bar key={d.label} dataKey="value" name={d.label} fill={d.color} radius={[4, 4, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Compliance donut ──────────────────────────────────────────────────────────

function ComplianceChart({
  compliance,
}: {
  compliance: {
    activeLicenses: number;
    expiredLicenses: number;
    pendingReviews: number;
    recalledItems: number;
    quarantinedItems: number;
  } | undefined;
}) {
  const data = [
    { name: "Active", value: compliance?.activeLicenses ?? 0 },
    { name: "Expired", value: compliance?.expiredLicenses ?? 0 },
    { name: "Pending", value: compliance?.pendingReviews ?? 0 },
    { name: "Recalled", value: compliance?.recalledItems ?? 0 },
    { name: "Quarantined", value: compliance?.quarantinedItems ?? 0 },
  ].filter((d) => d.value > 0);

  const empty = data.length === 0 || data.every((d) => d.value === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Compliance Status</CardTitle>
        <CardDescription>License and item compliance breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        {empty ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No compliance data yet
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={180}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => (
                    <ChartTooltip
                      active={active}
                      payload={payload?.map((p, i) => ({
                        name: String(p.name ?? ""),
                        value: Number(p.value ?? 0),
                        color: PIE_COLORS[i % PIE_COLORS.length],
                      }))}
                    />
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 flex-1 min-w-0">
              {data.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="truncate text-muted-foreground">{d.name}</span>
                  <span className="ml-auto font-semibold text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── QR Scan activity section ─────────────────────────────────────────────────
// Note: backed by the same /api/analytics/executive endpoint — real-time scan
// counts are tracked by the backend's audit trail. The market.consumerSales and
// market.productsSold fields are the closest proxy for QR-driven activity until
// a dedicated scan-events endpoint is added.

function QrActivitySection({
  executive,
}: {
  executive: ReturnType<typeof useExecutiveSummary>["data"];
}) {
  const topProducts = executive?.market?.topProducts ?? [];
  const total = topProducts.reduce((acc, p) => acc + p.units, 0) || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ScanLine className="size-4 text-primary" />
          QR Scan Activity
        </CardTitle>
        <CardDescription>
          Top traced products by unit activity. Each scan of a serialised item
          creates an audit event — scan count approximates from sold/dispatched units.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {topProducts.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No scan activity recorded yet
          </div>
        ) : (
          <div className="space-y-3">
            {topProducts.slice(0, 8).map((p) => {
              const pct = Math.round((p.units / total) * 100);
              return (
                <div key={p.productId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground truncate max-w-[60%]">
                      {p.productName}
                    </span>
                    <span className="text-muted-foreground">
                      {p.units.toLocaleString()} units · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-foreground">
              {(executive?.market?.consumerSales ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Consumer scans / sales</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-foreground">
              {(executive?.market?.productsSold ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Products sold</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Industry breakdown (regulator only) ─────────────────────────────────────

function IndustryBreakdown() {
  const { data: categories, isLoading } = useIndustryCategories({ enabled: true });

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Loading industry data…
      </div>
    );
  }

  const data = (categories ?? []).map((c) => ({
    name: c.category,
    Organizations: c.count,
    Employees: c.totalEmployees,
  }));

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No industry data available.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: "#f1f5f9" }}
          content={({ active, payload, label }) => (
            <ChartTooltip
              active={active}
              payload={payload?.map((p) => ({
                name: String(p.dataKey ?? ""),
                value: Number(p.value ?? 0),
                color: String(p.fill ?? CHART_COLORS.primary),
              }))}
              label={label ?? undefined}
            />
          )}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Organizations" fill={CHART_COLORS.primary} radius={[3, 3, 0, 0]} barSize={18} />
        <Bar dataKey="Employees" fill={CHART_COLORS.success} radius={[3, 3, 0, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { data: me } = useCurrentUser();
  const isRegulator = me?.organization?.type === "REGULATOR";
  const orgType = me?.organization?.type;

  const { data: executive, isLoading: execLoading } = useExecutiveSummary();
  const { data: supplyChain, isLoading: scLoading } = useSupplyChainSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <BarChart3 className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            {isRegulator
              ? "Platform-wide compliance, industry, and traceability metrics."
              : "Operational insights — production, inventory, sales, and supply chain."}
          </p>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Licenses"
          value={executive?.compliance?.activeLicenses ?? "—"}
          icon={<ShieldCheck className="size-4" />}
          iconBg="bg-primary"
          caption="Compliant permits"
          badge={execLoading ? "Loading" : undefined}
          badgeType="neutral"
        />
        <MetricCard
          title="Available Units"
          value={(executive?.supplyChain?.availableUnits ?? 0).toLocaleString()}
          icon={<Package className="size-4" />}
          iconBg="bg-success"
          caption="In stock across locations"
        />
        <MetricCard
          title="Distinct Products"
          value={executive?.supplyChain?.distinctProducts ?? "—"}
          icon={<Box className="size-4" />}
          iconBg="bg-primary"
          caption="Unique traced products"
        />
        <MetricCard
          title="Revenue"
          value={`RWF ${(executive?.finance?.revenue ?? 0).toLocaleString()}`}
          icon={<TrendingUp className="size-4" />}
          iconBg="bg-warning"
          caption="Total invoiced"
        />
      </div>

      {/* ── Secondary KPI row ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-foreground">
            {(supplyChain?.inTransitUnits ?? 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Units in transit</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-foreground">
            {supplyChain?.inTransitShipments ?? 0}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Active shipments</p>
        </div>
        <div className="rounded-xl border border-danger/20 bg-danger/8 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-danger">
            {supplyChain?.stockOutProducts ?? 0}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Stock-out products</p>
        </div>
        <div className="rounded-xl border border-warning/20 bg-warning/8 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-warning-foreground">
            {executive?.compliance?.pendingReviews ?? 0}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Pending reviews</p>
        </div>
      </div>

      {/* ── Charts row 1 ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProductionTrendChart />
        </div>
        <ComplianceChart compliance={executive?.compliance} />
      </div>

      {/* ── Charts row 2 ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {!scLoading && <SupplyChainChart sc={supplyChain} />}
        <QrActivitySection executive={executive} />
      </div>

      {/* ── Regulator: industry breakdown ── */}
      {isRegulator && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              <div>
                <CardTitle className="text-base">Industry Breakdown</CardTitle>
                <CardDescription className="mt-0.5">
                  Organizations and employees by sector
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <IndustryBreakdown />
          </CardContent>
        </Card>
      )}

      {/* ── Sales summary (trading orgs) ── */}
      {orgType && orgType !== "REGULATOR" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <ShoppingCart className="size-3.5 text-success" />
                Sales activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {(executive?.market?.productsSold ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Products sold</p>
              <p className="mt-3 flex items-center gap-1 text-xs text-success font-medium">
                <ArrowUpRight className="size-3.5" />
                {executive?.market?.consumerSales ?? 0} consumer transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Truck className="size-3.5 text-primary" />
                Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {executive?.supplyChain?.distributionVolumes ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Received transfers</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {supplyChain?.rawMaterialCount ?? 0} raw material lines tracked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <AlertTriangle className="size-3.5 text-danger" />
                Compliance alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-danger">
                {executive?.compliance?.recalledItems ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Recalled items</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {executive?.compliance?.quarantinedItems ?? 0} quarantined ·{" "}
                {executive?.compliance?.expiredLicenses ?? 0} expired licenses
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
