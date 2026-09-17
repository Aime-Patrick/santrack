"use client";

import { Suspense, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  FileBadge,
  Users,
  Activity,
  MapPin,
  Mail,
  Phone,
  Calendar,
  ShieldAlert,
  ClipboardCheck,
  Package,
  AlertTriangle,
  Megaphone,
  Eye,
  Factory,
  Gavel,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageTabs, TabsContent } from "@/components/ui/page-tabs";
import { useIndustryRegistry } from "@/hooks/organizations";
import { useUsers } from "@/hooks/users";
import { useOrganizationTimeline } from "@/hooks/accountability";
import { useRegulatoryCases } from "@/hooks/regulatory-cases";
import { OpenOrgCaseButton } from "@/components/regulator/open-org-case-button";
import { IndustryLicencesTable } from "@/components/regulator/industry-licences-table";
import { IndustryCasesTable } from "@/components/regulator/industry-cases-table";
import {
  FLAG_BLUE,
  FLAG_DANGER,
  FLAG_GREEN,
  FLAG_NEUTRAL,
  FLAG_YELLOW,
} from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import type { RegistryEntry } from "@/services/organization.service";

const TYPE_LABELS: Record<string, string> = {
  MANUFACTURER: "Manufacturing",
  WAREHOUSE: "Warehousing",
  DISTRIBUTOR: "Distribution",
  RETAILER: "Retail",
  SHOP: "Shop",
  REGULATOR: "Regulator",
  CONSUMER: "Consumer",
};

const SOURCE_STYLE: Record<string, { bg: string; icon: typeof ShieldAlert; label: string }> = {
  CASE: { bg: FLAG_DANGER, icon: ShieldAlert, label: "Case" },
  LICENSE: { bg: FLAG_BLUE, icon: FileBadge, label: "Licence" },
  INSPECTION: { bg: FLAG_YELLOW, icon: ClipboardCheck, label: "Inspection" },
  TRACEABILITY: { bg: FLAG_GREEN, icon: Package, label: "Trace event" },
  FINDING: { bg: FLAG_DANGER, icon: AlertTriangle, label: "Finding" },
  COMPLAINT: { bg: FLAG_BLUE, icon: Megaphone, label: "Complaint" },
};

const INDUSTRY_TABS = ["overview", "licences", "cases", "timeline"] as const;
type IndustryTab = (typeof INDUSTRY_TABS)[number];

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function licenceStanding(
  licenses: { status: string }[],
): "active" | "suspended" | "pending" | "inactive" {
  if (licenses.some((l) => l.status === "SUSPENDED")) return "suspended";
  if (licenses.some((l) => l.status === "ACTIVE")) return "active";
  if (licenses.some((l) => l.status === "SUBMITTED" || l.status === "UNDER_REVIEW" || l.status === "CHANGES_REQUESTED")) {
    return "pending";
  }
  return "inactive";
}

const STANDING_COPY: Record<string, { label: string; style: string }> = {
  active: { label: "Licensed", style: FLAG_GREEN },
  suspended: { label: "Suspended standing", style: FLAG_YELLOW },
  pending: { label: "Application pending", style: FLAG_YELLOW },
  inactive: { label: "Unlicensed", style: FLAG_NEUTRAL },
};

function isOpenCase(status: string) {
  return status === "OPEN" || status === "IN_PROGRESS" || status === "ESCALATED" || status === "AWAITING_BUSINESS";
}

export default function IndustryDetailPage() {
  return (
    <Suspense fallback={null}>
      <IndustryDetail />
    </Suspense>
  );
}

function IndustryDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = Number(params.id);
  const requestedTab = searchParams.get("tab");
  const tab = INDUSTRY_TABS.includes(requestedTab as IndustryTab)
    ? (requestedTab as IndustryTab)
    : "overview";

  const { data: orgs, isLoading: orgsLoading } = useIndustryRegistry();
  const { data: users } = useUsers(orgId);
  const { data: timeline, isLoading: timelineLoading } = useOrganizationTimeline(orgId, 100);
  const { data: allCases } = useRegulatoryCases();

  const org: RegistryEntry | undefined = orgs?.find((o) => o.id === orgId);
  const orgCases = useMemo(
    () => allCases?.filter((c) => c.organization.id === orgId) ?? [],
    [allCases, orgId],
  );
  const openCases = orgCases.filter((c) => isOpenCase(c.status));

  function setTab(next: IndustryTab) {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (next === "overview") nextParams.delete("tab");
    else nextParams.set("tab", next);
    const qs = nextParams.toString();
    router.replace(
      qs ? `/dashboard/industries/${orgId}?${qs}` : `/dashboard/industries/${orgId}`,
      { scroll: false },
    );
  }

  if (orgsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <div className="text-muted-foreground">Organization not found</div>
        <Button variant="outline" onClick={() => router.push("/dashboard/industries")}>
          Back to industries
        </Button>
      </div>
    );
  }

  const standing = licenceStanding(org.licenses ?? []);
  const standingTone = STANDING_COPY[standing];
  const suspended = (org.licenses ?? []).filter((l) => l.status === "SUSPENDED");
  const pendingLicences = (org.licenses ?? []).filter(
    (l) => l.status === "SUBMITTED" || l.status === "UNDER_REVIEW",
  );
  const sectorLabel = org.industrySector
    ? org.industrySector.replaceAll("_", " ").toLowerCase()
    : null;
  const onboarding = org.onboardingStatus;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard/industries")}
            className="flex size-9 items-center justify-center rounded-lg border border-border/60 transition-colors hover:bg-muted/50"
            title="Back to industries"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex size-10 items-center justify-center rounded-lg bg-rwanda-green text-white">
            <Building2 className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{org.name}</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{TYPE_LABELS[org.type] ?? org.type}</span>
              <span className="text-faint">·</span>
              <span>ORG-{String(org.id).padStart(3, "0")}</span>
              {sectorLabel ? (
                <>
                  <span className="text-faint">·</span>
                  <span className="capitalize">{sectorLabel}</span>
                </>
              ) : null}
              <Badge className={cn(standingTone.style, "text-[10px] px-2 py-0.5 font-medium")}>
                {standingTone.label}
              </Badge>
              {onboarding && onboarding !== "APPROVED" ? (
                <Badge className={cn(FLAG_YELLOW, "text-[10px] px-2 py-0.5 font-medium")}>
                  Registration {onboarding.replaceAll("_", " ").toLowerCase()}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <OpenOrgCaseButton
            organizationId={org.id}
            organizationName={org.name}
            label="Open investigation"
            size="default"
          />
          {pendingLicences.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/regulator?tab=licences")}
            >
              <Gavel className="size-3.5" />
              Licence queue
            </Button>
          ) : null}
          {onboarding === "PENDING" || onboarding === "CHANGES_REQUESTED" ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/regulator?tab=registrations")}
            >
              Registrations
            </Button>
          ) : null}
        </div>
      </div>

      {(suspended.length > 0 || pendingLicences.length > 0 || openCases.length > 0) && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-border/70 bg-[#f0f7ff] px-4 py-3">
          {suspended.length > 0 ? (
            <AttentionChip
              tone={FLAG_YELLOW}
              label={`${suspended.length} suspended licence${suspended.length === 1 ? "" : "s"}`}
              action="Reinstate or revoke"
              onClick={() => setTab("licences")}
            />
          ) : null}
          {pendingLicences.length > 0 ? (
            <AttentionChip
              tone={FLAG_BLUE}
              label={`${pendingLicences.length} application${pendingLicences.length === 1 ? "" : "s"} waiting`}
              action="Review in queue"
              onClick={() => router.push("/dashboard/regulator?tab=licences")}
            />
          ) : null}
          {openCases.length > 0 ? (
            <AttentionChip
              tone={FLAG_DANGER}
              label={`${openCases.length} open case${openCases.length === 1 ? "" : "s"}`}
              action="Work cases"
              onClick={() => setTab("cases")}
            />
          ) : null}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Staff",
            value: users?.length ?? org.staff ?? 0,
            icon: Users,
            bg: FLAG_GREEN,
            tab: null as IndustryTab | null,
          },
          {
            label: "Sites",
            value: org.facilities ?? 0,
            icon: Factory,
            bg: FLAG_BLUE,
            tab: "overview" as IndustryTab | null,
          },
          {
            label: "Licences",
            value: org.licenses?.length ?? 0,
            icon: FileBadge,
            bg: FLAG_BLUE,
            tab: "licences" as IndustryTab | null,
          },
          {
            label: "Open cases",
            value: openCases.length,
            icon: ShieldAlert,
            bg: openCases.length > 0 ? FLAG_DANGER : FLAG_NEUTRAL,
            tab: "cases" as IndustryTab | null,
          },
          {
            label: "Timeline",
            value: timeline?.length ?? 0,
            icon: Activity,
            bg: FLAG_YELLOW,
            tab: "timeline" as IndustryTab | null,
          },
        ].map((stat) => (
          <button
            key={stat.label}
            type="button"
            disabled={!stat.tab}
            onClick={() => stat.tab && setTab(stat.tab)}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border/60 p-3.5 text-left transition-colors",
              stat.tab ? "hover:bg-muted/40 cursor-pointer" : "cursor-default",
            )}
          >
            <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg text-white", stat.bg)}>
              <stat.icon className="size-4" />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight leading-none">{stat.value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          </button>
        ))}
      </div>

      <PageTabs
        value={tab}
        onValueChange={(next) => setTab(next as IndustryTab)}
        fullWidth
        items={[
          { value: "overview", label: "Overview", icon: Eye },
          {
            value: "licences",
            label: "Licences",
            icon: FileBadge,
            count: org.licenses?.length ?? 0,
            badgeVariant: "default",
          },
          {
            value: "cases",
            label: "Cases",
            icon: ShieldAlert,
            count: openCases.length,
            badgeVariant: openCases.length > 0 ? "danger" : "secondary",
          },
          { value: "timeline", label: "Accountability", icon: Activity },
        ]}
      >
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <div className="border-b border-border/60 bg-muted/30 px-5 py-3">
              <h3 className="text-sm font-semibold">Business details</h3>
            </div>
            <div className="divide-y divide-border/60">
              {[
                { icon: Building2, label: "Type", value: TYPE_LABELS[org.type] ?? org.type },
                sectorLabel && { icon: Package, label: "Sector", value: sectorLabel.replace(/\b\w/g, (c) => c.toUpperCase()) },
                org.tin && { icon: FileBadge, label: "TIN", value: org.tin },
                org.registrationNumber && {
                  icon: FileBadge,
                  label: "Registration No.",
                  value: org.registrationNumber,
                },
                org.email && { icon: Mail, label: "Email", value: org.email },
                org.phone && { icon: Phone, label: "Phone", value: org.phone },
                org.dateIncorporated && {
                  icon: Calendar,
                  label: "Incorporated",
                  value: formatDate(org.dateIncorporated),
                },
                {
                  icon: Factory,
                  label: "Sites / products",
                  value: `${org.facilities ?? 0} sites · ${org.products ?? 0} products`,
                },
              ]
                .filter(Boolean)
                .map((item) =>
                  item ? (
                    <div key={item.label} className="flex items-center gap-3 px-5 py-2.5">
                      <item.icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="w-32 shrink-0 text-xs text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium capitalize">{item.value}</span>
                    </div>
                  ) : null,
                )}
            </div>
          </div>

          {(org.province || org.district || org.sector || org.cell || org.village) && (
            <div className="overflow-hidden rounded-xl border border-border/60">
              <div className="border-b border-border/60 bg-muted/30 px-5 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="size-4 text-muted-foreground" />
                  Location
                </h3>
              </div>
              <div className="px-5 py-3">
                <p className="text-sm font-medium">
                  {[org.village, org.cell, org.sector, org.district, org.province]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>
          )}

          {org.description ? (
            <div className="overflow-hidden rounded-xl border border-border/60">
              <div className="border-b border-border/60 bg-muted/30 px-5 py-3">
                <h3 className="text-sm font-semibold">Description</h3>
              </div>
              <div className="px-5 py-3">
                <p className="text-sm text-muted-foreground">{org.description}</p>
              </div>
            </div>
          ) : null}

          {(org.reviewNote || org.rejectionReason) && (
            <div className="overflow-hidden rounded-xl border border-border/60">
              <div className="border-b border-border/60 bg-muted/30 px-5 py-3">
                <h3 className="text-sm font-semibold">Registration notes</h3>
              </div>
              <div className="space-y-2 px-5 py-3 text-sm text-muted-foreground">
                {org.reviewNote ? <p>{org.reviewNote}</p> : null}
                {org.rejectionReason ? <p>{org.rejectionReason}</p> : null}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="licences" className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Enforce standing here. Pending applications are decided on the licence queue.
            </p>
            {pendingLicences.length > 0 ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => router.push("/dashboard/regulator?tab=licences")}
              >
                Open licence queue
                <ArrowRight className="size-3.5" />
              </Button>
            ) : null}
          </div>

          <IndustryLicencesTable
            organizationId={org.id}
            organizationName={org.name}
            licenses={org.licenses ?? []}
          />
        </TabsContent>

        <TabsContent value="cases" className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Cases opened against this business. Open one to assign, inspect, or close it.
            </p>
            <OpenOrgCaseButton
              organizationId={org.id}
              organizationName={org.name}
              label="Open investigation"
            />
          </div>
          <IndustryCasesTable cases={orgCases} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          {timelineLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl border border-border/60 bg-muted/20" />
              ))}
            </div>
          ) : !timeline || timeline.length === 0 ? (
            <div className="rounded-xl border border-border/60 p-8 text-center">
              <Activity className="mx-auto mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No events recorded for this business yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {timeline.map((entry) => {
                const source = SOURCE_STYLE[entry.source] ?? SOURCE_STYLE.TRACEABILITY;
                const Icon = source.icon;
                const clickable = Boolean(entry.caseId || entry.findingId);
                return (
                  <div
                    key={entry.id}
                    role={clickable ? "button" : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    onClick={() => {
                      if (entry.caseId) {
                        router.push(`/dashboard/regulator?tab=enforcement&case=${entry.caseId}`);
                        return;
                      }
                      if (entry.findingId) {
                        router.push(`/dashboard/compliance/findings/${entry.findingId}`);
                      }
                    }}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border border-border/60 px-4 py-3",
                      clickable && "cursor-pointer hover:bg-muted/40",
                    )}
                  >
                    <div className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-white", source.bg)}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={cn(source.bg, "text-white")}>{source.label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.recordedAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm font-medium">{entry.summary}</p>
                      {entry.actor ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">by {entry.actor}</p>
                      ) : null}
                    </div>
                    {clickable ? <ArrowRight className="mt-2 size-4 shrink-0 text-muted-foreground" /> : null}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </PageTabs>
    </div>
  );
}

function AttentionChip({
  tone,
  label,
  action,
  onClick,
}: {
  tone: string;
  label: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-left text-xs shadow-sm ring-1 ring-border/60 transition-colors hover:bg-muted/40 cursor-pointer"
    >
      <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white", tone)}>
        {label}
      </span>
      <span className="font-semibold text-[#067eda]">{action}</span>
      <ArrowRight className="size-3 text-[#067eda]" />
    </button>
  );
}
