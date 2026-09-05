"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  FileBadge,
  Users,
  Activity,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Shield,
  ShieldAlert,
  ClipboardCheck,
  Package,
  AlertTriangle,
  Megaphone,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIndustryRegistry } from "@/hooks/organizations";
import { useUsers } from "@/hooks/users";
import { useOrganizationTimeline } from "@/hooks/accountability";
import { useRegulatoryCases } from "@/hooks/regulatory-cases";
import type { RegulatoryCase } from "@/services/regulatory-case.service";
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

const LICENCE_STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-success text-white",
  SUBMITTED: "bg-blue-600 text-white",
  UNDER_REVIEW: "bg-blue-600 text-white",
  EXPIRED: "bg-danger text-white",
  REVOKED: "bg-danger text-white",
  SUSPENDED: "bg-amber-500 text-white",
};

const SOURCE_STYLE: Record<string, { bg: string; icon: typeof ShieldAlert; label: string }> = {
  CASE: { bg: "bg-danger", icon: ShieldAlert, label: "Case" },
  LICENSE: { bg: "bg-blue-600", icon: FileBadge, label: "Licence" },
  INSPECTION: { bg: "bg-amber-500", icon: ClipboardCheck, label: "Inspection" },
  TRACEABILITY: { bg: "bg-emerald-600", icon: Package, label: "Trace event" },
  FINDING: { bg: "bg-orange-500", icon: AlertTriangle, label: "Finding" },
  COMPLAINT: { bg: "bg-rose-600", icon: Megaphone, label: "Complaint" },
};

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function licenceStanding(licenses: { status: string }[]): "active" | "pending" | "inactive" {
  if (licenses.some((l) => l.status === "ACTIVE")) return "active";
  if (licenses.some((l) => l.status === "SUBMITTED" || l.status === "UNDER_REVIEW")) return "pending";
  return "inactive";
}

const STANDING_STYLE: Record<string, string> = {
  active: "bg-success text-white",
  pending: "bg-amber-500 text-white",
  inactive: "bg-muted-foreground text-white",
};

export default function IndustryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = Number(params.id);

  const { data: orgs, isLoading: orgsLoading } = useIndustryRegistry();
  const { data: users } = useUsers(orgId);
  const { data: timeline, isLoading: timelineLoading } = useOrganizationTimeline(orgId, 100);
  const { data: allCases } = useRegulatoryCases();

  const org: RegistryEntry | undefined = orgs?.find((o) => o.id === orgId);
  const orgCases = allCases?.filter((c) => c.organization.id === orgId) ?? [];
  const openCases = orgCases.filter(
    (c) => c.status === "OPEN" || c.status === "IN_PROGRESS" || c.status === "ESCALATED",
  );

  if (orgsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-muted-foreground">Organization not found</div>
      </div>
    );
  }

  const standing = licenceStanding(org.licenses ?? []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard/industries")}
          className="flex size-9 items-center justify-center rounded-lg border border-border/60 hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex size-10 items-center justify-center rounded-lg bg-success text-white">
          <Building2 className="size-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">{org.name}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{TYPE_LABELS[org.type] ?? org.type}</span>
            <span className="text-faint">·</span>
            <span>ORG-{String(org.id).padStart(3, "0")}</span>
            <Badge className={`${STANDING_STYLE[standing]} text-[10px] px-2 py-0.5 rounded-full font-medium`}>
              {standing === "active" ? "Licensed" : standing === "pending" ? "Pending" : "Unlicensed"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Staff", value: users?.length ?? 0, icon: Users, bg: "bg-success" },
          { label: "Licences", value: org.licenses?.length ?? 0, icon: FileBadge, bg: "bg-blue-600" },
          { label: "Open cases", value: openCases.length, icon: ShieldAlert, bg: openCases.length > 0 ? "bg-danger" : "bg-muted-foreground" },
          { label: "Timeline events", value: timeline?.length ?? 0, icon: Activity, bg: "bg-amber-500" },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 p-4 rounded-xl border border-border/60">
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${stat.bg} text-white`}>
              <stat.icon className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <Eye className="mr-1.5 size-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="licences">
            <FileBadge className="mr-1.5 size-4" />
            Licences
            {org.licenses && org.licenses.length > 0 && (
              <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0 rounded-full">
                {org.licenses.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="cases">
            <ShieldAlert className="mr-1.5 size-4" />
            Cases
            {openCases.length > 0 && (
              <Badge className="bg-danger text-white ml-1.5 text-[10px] px-1.5 py-0 rounded-full">
                {openCases.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Activity className="mr-1.5 size-4" />
            Accountability
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Business details */}
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <div className="px-5 py-3 border-b border-border/60 bg-muted/30">
              <h3 className="text-sm font-semibold">Business Details</h3>
            </div>
            <div className="divide-y divide-border/60">
              {[
                { icon: Building2, label: "Type", value: TYPE_LABELS[org.type] ?? org.type },
                org.tin && { icon: FileBadge, label: "TIN", value: org.tin },
                org.registrationNumber && { icon: FileBadge, label: "Registration No.", value: org.registrationNumber },
                org.email && { icon: Mail, label: "Email", value: org.email },
                org.phone && { icon: Phone, label: "Phone", value: org.phone },
                org.dateIncorporated && { icon: Calendar, label: "Incorporated", value: formatDate(org.dateIncorporated) },
              ]
                .filter(Boolean)
                .map((item) =>
                  item ? (
                    <div key={item.label} className="flex items-center gap-3 px-5 py-2.5">
                      <item.icon className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground w-28 shrink-0">{item.label}</span>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  ) : null,
                )}
            </div>
          </div>

          {/* Location */}
          {(org.province || org.district || org.sector || org.cell || org.village) && (
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="px-5 py-3 border-b border-border/60 bg-muted/30">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  Location
                </h3>
              </div>
              <div className="px-5 py-3">
                <p className="text-sm font-medium">
                  {[org.village, org.cell, org.sector, org.district, org.province].filter(Boolean).join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {org.description && (
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="px-5 py-3 border-b border-border/60 bg-muted/30">
                <h3 className="text-sm font-semibold">Description</h3>
              </div>
              <div className="px-5 py-3">
                <p className="text-sm text-muted-foreground">{org.description}</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Licences ── */}
        <TabsContent value="licences" className="mt-4">
          {!org.licenses || org.licenses.length === 0 ? (
            <div className="rounded-xl border border-border/60 p-8 text-center">
              <FileBadge className="size-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No licences on record</p>
            </div>
          ) : (
            <div className="space-y-2">
              {org.licenses.map((licence, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-border/60 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                      <FileBadge className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{licence.activity}</p>
                      <p className="text-xs text-muted-foreground">{licence.licenseNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {licence.expiresOn ? `Expires ${formatDate(licence.expiresOn)}` : "No expiry"}
                    </span>
                    <Badge className={`${LICENCE_STATUS_STYLE[licence.status] ?? "bg-muted-foreground text-white"} text-[10px] px-2 py-0.5 rounded-full font-medium`}>
                      {licence.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Cases ── */}
        <TabsContent value="cases" className="mt-4">
          {orgCases.length === 0 ? (
            <div className="rounded-xl border border-border/60 p-8 text-center">
              <Shield className="size-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No regulatory cases on record</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orgCases.map((c) => (
                <CaseRow key={c.id} c={c} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Accountability Timeline ── */}
        <TabsContent value="timeline" className="mt-4">
          {timelineLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl border border-border/60 animate-pulse bg-muted/20" />
              ))}
            </div>
          ) : !timeline || timeline.length === 0 ? (
            <div className="rounded-xl border border-border/60 p-8 text-center">
              <Activity className="size-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No events recorded for this business yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {timeline.map((entry) => {
                const source = SOURCE_STYLE[entry.source] ?? SOURCE_STYLE.TRACEABILITY;
                const Icon = source.icon;
                return (
                  <div key={entry.id} className="flex items-start gap-3 rounded-xl border border-border/60 px-4 py-3">
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${source.bg} text-white mt-0.5`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className={`${source.bg} text-white text-[10px] px-2 py-0.5 rounded-full font-medium`}>
                          {source.label}
                        </Badge>
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
                      <p className="text-sm font-medium mt-0.5">{entry.summary}</p>
                      {entry.actor && (
                        <p className="text-xs text-muted-foreground mt-0.5">by {entry.actor}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CaseRow({ c }: { c: RegulatoryCase }) {
  const statusStyle: Record<string, string> = {
    OPEN: "bg-danger text-white",
    IN_PROGRESS: "bg-blue-600 text-white",
    AWAITING_BUSINESS: "bg-amber-500 text-white",
    ESCALATED: "bg-danger text-white",
    RESOLVED: "bg-success text-white",
    CLOSED: "bg-muted-foreground text-white",
  };
  const priorityStyle: Record<string, string> = {
    LOW: "bg-muted-foreground text-white",
    NORMAL: "bg-blue-600 text-white",
    HIGH: "bg-amber-500 text-white",
    CRITICAL: "bg-danger text-white",
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-danger text-white">
          <ShieldAlert className="size-4" />
        </div>
        <div>
          <p className="text-sm font-medium">{c.title}</p>
          <p className="text-xs text-muted-foreground">
            {c.caseNumber ?? `CASE-${String(c.id).padStart(4, "0")}`}
            {c.assignedTo && ` · Assigned to ${c.assignedTo.name}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={`${priorityStyle[c.priority] ?? priorityStyle.NORMAL} text-[10px] px-2 py-0.5 rounded-full font-medium`}>
          {c.priority}
        </Badge>
        <Badge className={`${statusStyle[c.status] ?? statusStyle.OPEN} text-[10px] px-2 py-0.5 rounded-full font-medium`}>
          {c.status.replace("_", " ")}
        </Badge>
      </div>
    </div>
  );
}
