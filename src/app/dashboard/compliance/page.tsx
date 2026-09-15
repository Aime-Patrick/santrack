"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  Factory,
  FileBadge,
  FileSearch,
  Package,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LicenceSummaryPanel } from "@/components/compliance/licence-summary";
import {
  StatusBadge,
  StatusIcon,
  statusSurface,
} from "@/components/compliance/status-badge";
import { useComplianceOverview } from "@/hooks/compliance";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getApiErrorMessage } from "@/lib/api";
import { enforcementLabel } from "@/services/compliance.service";
import type { FacilityCompliance } from "@/services/compliance.service";
import { cn } from "@/lib/utils";

const OVERVIEW_TABS = ["organization", "sites", "products"] as const;
type OverviewTab = (typeof OVERVIEW_TABS)[number];

function isOverviewTab(value: string | null): value is OverviewTab {
  return OVERVIEW_TABS.includes(value as OverviewTab);
}

/**
 * Compliance → Overview (DR-07 WU-8).
 * Everything is decided by GET /api/compliance/overview.
 */
export default function CompliancePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      }
    >
      <ComplianceOverviewWorkspace />
    </Suspense>
  );
}

function ComplianceOverviewWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: me } = useCurrentUser();
  const hasOrganization = !!me?.organization;
  const { data, isLoading, isError, error, refetch, isFetching } =
    useComplianceOverview({ enabled: hasOrganization });
  const [tab, setTab] = useState<OverviewTab>(() => {
    const wanted = searchParams.get("tab");
    return isOverviewTab(wanted) ? wanted : "organization";
  });

  const onTabChange = (next: string) => {
    if (!isOverviewTab(next)) return;
    setTab(next);
    router.replace(`/dashboard/compliance?tab=${next}`, { scroll: false });
  };

  const evaluatedAt = data?.evaluatedAt ? new Date(data.evaluatedAt) : null;

  // -- No organization ---------------------------------------------------
  if (me && !hasOrganization) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="border-l-2 border-border pl-5 py-2">
          <p className="text-sm text-muted-foreground">
            Open <span className="font-medium text-foreground">Industries</span>{" "}
            for the business register, or{" "}
            <span className="font-medium text-foreground">
              Industry compliance
            </span>{" "}
            for findings across every organization.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button render={<Link href="/dashboard/industries" />}>
              Go to Industries
            </Button>
            <Button
              variant="outline"
              render={<Link href="/dashboard/compliance/findings" />}
            >
              Industry compliance
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const facilities = data?.facilities ?? [];
  const products = data?.products ?? [];

  /** Worst status across a list — drives the summary bar cells. */
  const worstStatus = (statuses: (string | undefined)[]): string | undefined => {
    if (statuses.includes("FAIL")) return "FAIL";
    if (statuses.includes("WARN")) return "WARN";
    if (statuses.includes("PASS")) return "PASS";
    return undefined;
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader />
        <div className="flex items-center gap-4">
          {data && (
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-faint">
                Enforcement
              </p>
              <p className="font-mono text-sm font-semibold text-foreground">
                {enforcementLabel(data.enforcementMode)}
              </p>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("mr-1.5 size-3.5", isFetching && "animate-spin")}
            />
            Re-check
          </Button>
        </div>
      </div>

      {evaluatedAt && !Number.isNaN(evaluatedAt.getTime()) && (
        <p className="text-xs text-faint">
          Assessed {evaluatedAt.toLocaleString()}. Statuses below are what the
          server returned at that moment.
        </p>
      )}

      {hasOrganization && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/licenses" />}
          >
            <FileBadge className="mr-1.5 size-3.5" />
            Licences &amp; permits
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/compliance/cases" />}
          >
            <FileSearch className="mr-1.5 size-3.5" />
            Regulatory cases
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/recall" />}
          >
            <AlertTriangle className="mr-1.5 size-3.5" />
            Recalls
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="border-l-2 border-danger pl-5 py-3">
          <p className="text-sm font-semibold text-danger">
            The compliance assessment could not be loaded.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {getApiErrorMessage(
              error,
              "The server did not answer. Nothing on this screen is being guessed at in its place.",
            )}
          </p>
          <Button
            className="mt-3"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            Try again
          </Button>
        </div>
      )}

      {/* At-a-glance summary bar — shows all three verdicts before any tab click */}
      {data && (
        <div className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card">
          <SummaryCell
            icon={<Building2 className="size-4" />}
            label="Organization"
            status={data.organization?.status}
          />
          <SummaryCell
            icon={<Factory className="size-4" />}
            label={`${facilities.length} Site${facilities.length === 1 ? "" : "s"}`}
            status={worstStatus(facilities.map((f) => f.status))}
          />
          <SummaryCell
            icon={<Package className="size-4" />}
            label={`${products.length} Product${products.length === 1 ? "" : "s"}`}
            status={worstStatus(products.map((p) => p.status))}
          />
        </div>
      )}

      {/* Tabbed content */}
      {data && (
        <Tabs value={tab} onValueChange={onTabChange}>
          {/* Tab strip — underline style */}
          <div className="border-b border-border">
            <TabsList
              variant="line"
              className="h-auto gap-0 rounded-none bg-transparent p-0"
            >
              <TabsTrigger
                value="organization"
                className="flex items-center gap-2 rounded-none px-4 pb-3 pt-1 text-sm font-medium"
              >
                <Building2 className="size-3.5" />
                Organization
                <StatusDot status={data.organization?.status} />
              </TabsTrigger>

              <TabsTrigger
                value="sites"
                className="flex items-center gap-2 rounded-none px-4 pb-3 pt-1 text-sm font-medium"
              >
                <Factory className="size-3.5" />
                Sites
                {facilities.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground/50">—</span>
                ) : (
                  <CountBadge
                    count={facilities.length}
                    worst={worstStatus(facilities.map((f) => f.status))}
                  />
                )}
              </TabsTrigger>

              <TabsTrigger
                value="products"
                className="flex items-center gap-2 rounded-none px-4 pb-3 pt-1 text-sm font-medium"
              >
                <Package className="size-3.5" />
                Products
                {products.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground/50">—</span>
                ) : (
                  <CountBadge
                    count={products.length}
                    worst={worstStatus(products.map((p) => p.status))}
                  />
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB: Organization */}
          <TabsContent value="organization" className="pt-6">
            {/* Verdict card — colour-coded by status, name + verdict visible together */}
            <div
              className={cn(
                "flex flex-wrap items-start justify-between gap-4 rounded-xl border-l-4 p-4",
                statusLeftBorder(data.organization?.status),
                statusSurface(data.organization?.status),
              )}
            >
              <div>
                <p className="text-base font-semibold text-foreground">
                  {data.organization?.name ?? "This organization"}
                </p>
                {data.organization?.message && (
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {data.organization.message}
                  </p>
                )}
              </div>
              <StatusBadge status={data.organization?.status} size="lg" />
            </div>

            <div className="mt-5">
              <LicenceSummaryPanel
                licence={data.organization?.licence}
                emptyMessage="No company licence is on record for this activity."
              />
            </div>
          </TabsContent>

          {/* TAB: Sites */}
          <TabsContent value="sites" className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm text-muted-foreground">
                {facilities.length} site{facilities.length === 1 ? "" : "s"} ·
                each assessed against the licence that governs it
              </p>
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/dashboard/compliance/facilities" />}
              >
                Manage sites
                <ChevronRight className="ml-1 size-3.5" />
              </Button>
            </div>

            {facilities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <Factory className="mx-auto size-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  No sites on record
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Add a facility under Compliance → Sites to track site-level licensing.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  render={<Link href="/dashboard/compliance/facilities" />}
                >
                  Add a site
                </Button>
              </div>
            ) : (
              <div className="grid gap-px bg-border lg:grid-cols-2">
                {facilities.map((facility) => (
                  <FacilityRow key={facility.id} facility={facility} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB: Products */}
          <TabsContent value="products" className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              {products.length} product{products.length === 1 ? "" : "s"} ·
              category coverage as the server assessed it
            </p>

            {products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <Package className="mx-auto size-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  No products on record
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Products appear here once they are registered in your catalogue.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Standing</TableHead>
                      <TableHead>What it means</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow
                        key={product.id}
                        className={cn(
                          product.status === "FAIL" && "bg-red-50",
                          product.status === "WARN" && "bg-amber-50/60",
                        )}
                      >
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-2">
                            <StatusIcon
                              status={product.status}
                              className="size-3.5 shrink-0"
                            />
                            {product.name}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {product.sku || "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {product.categoryCode ?? "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={product.status} />
                        </TableCell>
                        <TableCell className="max-w-md text-sm text-muted-foreground">
                          {product.message}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PageHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
        <ShieldCheck className="size-4" />
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-tight">Compliance</h1>
        <p className="text-sm text-muted-foreground">
          Standing for this organization, its sites, and its products.
        </p>
      </div>
    </div>
  );
}

/**
 * At-a-glance summary cell above the tabs.
 * Shows the dimension name, count/label, and its worst status badge.
 * A user can see all three verdicts without clicking any tab.
 */
function SummaryCell({
  icon,
  label,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  status: string | undefined;
}) {
  return (
    <div className="flex flex-col gap-2 px-4 py-3 first:rounded-l-xl last:rounded-r-xl">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <StatusBadge status={status ?? "NOT_APPLICABLE"} />
    </div>
  );
}

/** Small coloured dot in the tab — shows PASS / WARN / FAIL at a glance. */
function StatusDot({ status }: { status: string | undefined }) {
  const color =
    status === "PASS"
      ? "bg-success"
      : status === "WARN"
        ? "bg-warning"
        : status === "FAIL"
          ? "bg-danger"
          : "bg-muted-foreground";

  return <span className={cn("inline-block size-1.5 rounded-full", color)} />;
}

/**
 * Count badge in the tab.
 * Turns red/amber when any item in the tab has FAIL/WARN — so the user
 * knows to look even before clicking.
 */
function CountBadge({
  count,
  worst,
}: {
  count: number;
  worst: string | undefined;
}) {
  const tone =
    worst === "FAIL"
      ? "bg-danger/15 text-danger"
      : worst === "WARN"
        ? "bg-warning/15 text-warning-foreground"
        : "bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold min-w-[18px]",
        tone,
      )}
    >
      {count}
    </span>
  );
}

function statusLeftBorder(status: string | undefined): string {
  switch (status) {
    case "PASS":
      return "border-success";
    case "WARN":
      return "border-warning";
    case "FAIL":
      return "border-danger";
    default:
      return "border-border";
  }
}

/**
 * One site row — no card wrapping, separated by a 1px grid gap.
 * Background tint derived from status, consistent with the org tab panel.
 */
function FacilityRow({ facility }: { facility: FacilityCompliance }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-4 bg-card",
        statusSurface(facility.status),
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {facility.name}
          </p>
          <p className="font-mono text-xs text-faint">{facility.code ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          {!facility.active && (
            <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Closed
            </span>
          )}
          <StatusBadge status={facility.status} />
        </div>
      </div>

      {facility.message && (
        <p className="text-sm leading-relaxed text-foreground">
          {facility.message}
        </p>
      )}

      <p className="text-xs font-medium text-muted-foreground">
        {facility.inherited
          ? "Covered by the company licence — this site does not hold one of its own."
          : facility.licence
            ? "Holds its own site licence, which replaces the company licence here."
            : "No licence governs this site."}
      </p>

      <div className="border-t border-border/60 pt-3">
        <LicenceSummaryPanel
          licence={facility.licence}
          emptyMessage="No licence was resolved for this site."
        />
      </div>
    </div>
  );
}
