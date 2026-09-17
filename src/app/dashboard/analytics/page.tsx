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
  Download,
  Eye,
  Briefcase,
  ClipboardList,
  FileWarning,
  Siren,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import {
  useExecutiveSummary,
  useIndustryCategories,
  useSupplyChainSummary,
  useProductionTrend,
} from "@/hooks/analytics";
import { useReportData } from "@/hooks/reports";
import { useRegulatoryCommand } from "@/hooks/regulatory-command";
import {
  reportService,
  reportTypesFor,
} from "@/services/report.service";
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

// ─── Reports panel ────────────────────────────────────────────────────────────

const reportCategoryConfig: Record<string, { icon: React.ReactNode; bg: string }> = {
  production:       { icon: <BarChart3 className="size-4 text-white" />,    bg: "bg-success" },
  inventory:        { icon: <Package className="size-4 text-white" />,      bg: "bg-primary" },
  "stock-movement": { icon: <Truck className="size-4 text-white" />,        bg: "bg-primary" },
  quality:          { icon: <ShieldCheck className="size-4 text-white" />,   bg: "bg-warning-foreground" },
  batch:            { icon: <Boxes className="size-4 text-white" />,        bg: "bg-primary" },
  shipment:         { icon: <Truck className="size-4 text-white" />,        bg: "bg-primary" },
  sales:            { icon: <ShoppingCart className="size-4 text-white" />, bg: "bg-success" },
  transfer:         { icon: <ArrowUpRight className="size-4 text-white" />, bg: "bg-primary" },
  licensing:        { icon: <ShieldCheck className="size-4 text-white" />,  bg: "bg-danger" },
  materials:        { icon: <Box className="size-4 text-white" />,          bg: "bg-warning-foreground" },
  recalls:          { icon: <Siren className="size-4 text-white" />,        bg: "bg-danger" },
  findings:         { icon: <FileWarning className="size-4 text-white" />,  bg: "bg-warning-foreground" },
  cases:            { icon: <ClipboardList className="size-4 text-white" />, bg: "bg-primary" },
};

function buildReportColumns(keys: string[]): ColumnDef<TableFeatures, Record<string, unknown>>[] {
  return keys.map((key) => ({
    accessorKey: key,
    header: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
    cell: ({ row }) => {
      const val = row.getValue(key);
      if (val == null) return "—";
      if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) return new Date(val).toLocaleDateString();
      return String(val);
    },
  }));
}

function ReportsPanel({ isRegulator }: { isRegulator: boolean }) {
  const reportTypes = reportTypesFor(isRegulator ? "REGULATOR" : undefined);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const { data, isLoading } = useReportData(selected ?? "", !!selected);

  React.useEffect(() => {
    setSelected(null);
  }, [isRegulator]);

  const rows = data ?? [];
  const columns = rows.length > 0 ? buildReportColumns(Object.keys(rows[0])) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {isRegulator
            ? "Export oversight ledgers for businesses you have licensed — not commercial factory data."
            : "Select a report type to preview and export its data."}
        </p>
        {selected && (
          <Button
            variant="outline"
            size="sm"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                await reportService.exportCsv(selected);
              } finally {
                setExporting(false);
              }
            }}
          >
            <Download className="mr-2 size-3.5" />
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {reportTypes.map((r) => {
          const cfg = reportCategoryConfig[r.name] ?? {
            icon: <Package className="size-4 text-white" />,
            bg: "bg-primary",
          };
          return (
            <button
              key={r.name}
              type="button"
              onClick={() => setSelected(r.name === selected ? null : r.name)}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                selected === r.name
                  ? "border-primary bg-primary-light shadow-sm ring-1 ring-primary/20"
                  : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
              }`}
            >
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}
              >
                {cfg.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{r.label}</p>
                <p className="text-[11px] text-muted-foreground">{r.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {selected ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {reportTypes.find((r) => r.name === selected)?.label}
            </CardTitle>
            <CardDescription>
              {isLoading ? "Loading…" : `${rows.length} rows`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                Loading…
              </div>
            ) : rows.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                No data for this report.
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={rows}
                filterPlaceholder="Search…"
                pageSize={10}
                noBorder
                showSelectionCount={false}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex h-40 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Eye className="mx-auto mb-2 size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">Select a report above</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RegulatorAnalyticsPanel() {
  const { data: command, isLoading } = useRegulatoryCommand();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Supervised businesses"
          value={command?.supervisedBusinesses ?? "—"}
          icon={<Building2 className="size-4" />}
          iconBg="bg-primary"
          caption="Hold at least one licence you issued"
          badge={isLoading ? "Loading" : undefined}
          badgeType="neutral"
        />
        <MetricCard
          title="Active cases"
          value={command?.activeCases ?? "—"}
          icon={<Briefcase className="size-4" />}
          iconBg="bg-primary"
          caption={`${command?.unassignedCases ?? 0} unassigned · ${command?.overdueCases ?? 0} overdue`}
        />
        <MetricCard
          title="Active recalls"
          value={command?.activeRecalls ?? "—"}
          icon={<Siren className="size-4" />}
          iconBg="bg-danger"
          caption="Recalled lots under your scope"
        />
        <MetricCard
          title="Market triage"
          value={command?.marketReportsToTriage ?? "—"}
          icon={<FileWarning className="size-4" />}
          iconBg="bg-warning"
          caption="Public complaints awaiting triage"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-foreground">
            {command?.inspectionsToday ?? 0}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Inspections today</p>
        </div>
        <div className="rounded-xl border border-warning/20 bg-warning/8 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-warning-foreground">
            {command?.highAttentionSignals ?? 0}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">High-attention signals</p>
        </div>
        <div className="rounded-xl border border-danger/20 bg-danger/8 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-danger">
            {command?.overdueCases ?? 0}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Overdue cases</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-foreground">
            {command?.unassignedCases ?? 0}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Unassigned cases</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            <div>
              <CardTitle className="text-base">Industry Breakdown</CardTitle>
              <CardDescription className="mt-0.5">
                Organizations and employees by sector across the platform
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <IndustryBreakdown />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { data: me } = useCurrentUser();
  const isRegulator = me?.organization?.type === "REGULATOR";
  const orgType = me?.organization?.type;

  const { data: executive, isLoading: execLoading } = useExecutiveSummary({
    enabled: !isRegulator,
  });
  const { data: supplyChain, isLoading: scLoading } = useSupplyChainSummary({
    enabled: !isRegulator,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <BarChart3 className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-sm text-muted-foreground">
            {isRegulator
              ? "Oversight metrics and exportable ledgers for businesses you supervise."
              : "Operational insights — production, inventory, sales, and supply chain."}
          </p>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList className="rounded-xl border border-border/80 bg-muted/50 p-1">
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="size-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <Boxes className="size-4" /> Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-5">
          {isRegulator ? (
            <RegulatorAnalyticsPanel />
          ) : (
            <>
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

              {/* ── Sales summary (trading orgs) ── */}
              {orgType && orgType !== "REGULATOR" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1.5">
                        <ShoppingCart className="size-3.5 text-success" /> Sales activity
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
                        <Truck className="size-3.5 text-primary" /> Distribution
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
                        <AlertTriangle className="size-3.5 text-danger" /> Compliance alerts
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
            </>
          )}
        </TabsContent>

        <TabsContent value="reports">
          <ReportsPanel isRegulator={isRegulator} />
        </TabsContent>
      </Tabs>
    </div>
  );
}