"use client";

import Link from "next/link";
import {
  Building2,
  Factory,
  Package,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LicenceSummaryPanel } from "@/components/compliance/licence-summary";
import { StatusBadge, statusSurface } from "@/components/compliance/status-badge";
import { useComplianceOverview } from "@/hooks/compliance";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getApiErrorMessage } from "@/lib/api";
import { enforcementLabel } from "@/services/compliance.service";
import type { FacilityCompliance } from "@/services/compliance.service";
import { cn } from "@/lib/utils";

/**
 * Compliance → Overview (DR-07 WU-8).
 *
 * Everything on this page was decided by `GET /api/compliance/overview`. The
 * organization's standing, each site's standing, each product's standing and
 * the enforcement mode all arrive as fields. The browser does not read a
 * licence's dates and conclude anything, does not work out which licence
 * governs a site, and does not decide what "provisional" means for enforcement.
 *
 * That is not fastidiousness. The sidebar carries a note about the last time a
 * second copy of the platform's rules lived in the browser: a hand-copied
 * role → capability table drifted from the server's and put the register of
 * every business on the platform in a production manager's menu. The same
 * mistake made against licensing rules would tell a manufacturer they were
 * covered when they were not.
 */
export default function CompliancePage() {
  const { data: me } = useCurrentUser();
  const hasOrganization = !!me?.organization;
  const { data, isLoading, isError, error, refetch, isFetching } =
    useComplianceOverview({ enabled: hasOrganization });

  const evaluatedAt = data?.evaluatedAt ? new Date(data.evaluatedAt) : null;

  if (me && !hasOrganization) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Compliance</h1>
            <p className="text-sm text-muted-foreground">
              Organization compliance belongs to each business, not the platform operator.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground">
              Open <span className="font-medium text-foreground">Industries</span> for
              the business register, or{" "}
              <span className="font-medium text-foreground">Industry compliance</span>{" "}
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Compliance</h1>
            <p className="text-sm text-muted-foreground">
              Where this organization, its sites and its products stand — as
              assessed by the platform.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-faint">
              Enforcement
            </p>
            <p className="font-mono text-sm font-semibold text-foreground">
              {data ? enforcementLabel(data.enforcementMode) : "—"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("mr-1.5 size-3.5", isFetching && "animate-spin")} />
            Re-check
          </Button>
        </div>
      </div>

      {evaluatedAt && !Number.isNaN(evaluatedAt.getTime()) && (
        <p className="-mt-3 text-xs text-faint">
          Assessed {evaluatedAt.toLocaleString()}. Every status on this page was
          decided by the server at that moment.
        </p>
      )}

      {isLoading && (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      )}

      {isError && (
        <Card className="border-danger/30 bg-danger/5">
          <CardContent className="py-6">
            <p className="text-sm font-semibold text-danger">
              The compliance assessment could not be loaded.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {getApiErrorMessage(
                error,
                "The server did not answer. Nothing on this screen is being guessed at in its place.",
              )}
            </p>
            <Button className="mt-4" variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* ── The organization ── */}
          <Card className={cn("border", statusSurface(data.organization?.status))}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Building2 className="size-4 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">
                      {data.organization?.name ?? "This organization"}
                    </CardTitle>
                    <CardDescription>Company-wide standing</CardDescription>
                  </div>
                </div>
                <StatusBadge status={data.organization?.status} size="lg" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.organization?.message && (
                <p className="text-sm leading-relaxed text-foreground">
                  {data.organization.message}
                </p>
              )}
              <LicenceSummaryPanel
                licence={data.organization?.licence}
                emptyMessage="No company licence is on record for this activity."
              />
            </CardContent>
          </Card>

          {/* ── Sites ── */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Sites</CardTitle>
                  <CardDescription>
                    {(data.facilities ?? []).length} site
                    {(data.facilities ?? []).length === 1 ? "" : "s"} · each one
                    assessed against the licence that governs it
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" render={<Link href="/dashboard/compliance/facilities" />}>
                  Manage sites
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(data.facilities ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No sites are on record for this organization.
                </p>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {(data.facilities ?? []).map((facility) => (
                    <FacilityCard key={facility.id} facility={facility} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Products ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Products</CardTitle>
              <CardDescription>
                {(data.products ?? []).length} product
                {(data.products ?? []).length === 1 ? "" : "s"} · category
                coverage as the server assessed it
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(data.products ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No products are on record for this organization.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Standing</TableHead>
                        <TableHead>What it means</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data.products ?? []).map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            <span className="flex items-center gap-2">
                              <Package className="size-3.5 text-faint" />
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

/**
 * One site's standing.
 *
 * `inherited` is why this component exists in this shape. A site covered by the
 * company's licence is said to be covered by the company's licence — not shown
 * a licence number in a way that implies the site holds one of its own. Under
 * DR-07 D1 that distinction has teeth: the moment a site gets its own licence
 * it stops inheriting, and a lapsed site licence halts that site while the
 * company remains nationally licensed.
 */
function FacilityCard({ facility }: { facility: FacilityCompliance }) {
  return (
    <div className={cn("rounded-xl border p-4", statusSurface(facility.status))}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Factory className="size-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">{facility.name}</p>
            <p className="font-mono text-xs text-faint">{facility.code ?? "—"}</p>
          </div>
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
        <p className="mt-3 text-sm leading-relaxed text-foreground">
          {facility.message}
        </p>
      )}

      <p className="mt-3 text-xs font-medium text-muted-foreground">
        {facility.inherited
          ? "Covered by the company licence — this site does not hold one of its own."
          : facility.licence
            ? "Holds its own site licence, which replaces the company licence here."
            : "No licence governs this site."}
      </p>

      <LicenceSummaryPanel
        licence={facility.licence}
        emptyMessage="No licence was resolved for this site."
        className="mt-3 border-t border-border/70 pt-3"
      />
    </div>
  );
}
