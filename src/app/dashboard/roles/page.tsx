"use client";

import { Shield, CheckCircle, XCircle, Landmark, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCapabilityCatalogue } from "@/hooks/permissions";
import type { Capability, UserRole } from "@/lib/api";

const roleLabels: Record<UserRole, string> = {
  SYSTEM_ADMIN: "System Admin",
  ORG_ADMIN: "Org Admin",
  PRODUCTION_MANAGER: "Production Manager",
  PRODUCTION_OFFICER: "Production Officer",
  WAREHOUSE_MANAGER: "Warehouse Manager",
  WAREHOUSE_OFFICER: "Warehouse Officer",
  QUALITY_OFFICER: "Quality Officer",
  LOGISTICS_OFFICER: "Logistics Officer",
  SALES_OFFICER: "Sales Officer",
  MANAGEMENT: "Management",
  AUDITOR: "Auditor",
};

const roleDescriptions: Record<UserRole, string> = {
  SYSTEM_ADMIN: "Platform operator. Administers the registry, regulatory standing and licence approval across every organization.",
  ORG_ADMIN: "The most senior role a customer holds. Everything inside their own organization, and nothing outside it.",
  PRODUCTION_MANAGER: "Oversees production: the catalogue, production orders, raw materials and inspection.",
  PRODUCTION_OFFICER: "Day-to-day production. Registers identities and handles packaging.",
  WAREHOUSE_MANAGER: "Warehouse inventory, stock movement, shipments and lifecycle decisions.",
  WAREHOUSE_OFFICER: "Warehouse floor. Packing and moving stock.",
  QUALITY_OFFICER: "Inspections, quarantine decisions, recalls and compliance.",
  LOGISTICS_OFFICER: "Dispatch, transfers and distribution.",
  SALES_OFFICER: "Sales, customer accounts, quotations and invoices.",
  MANAGEMENT: "Read-only across operations and analytics.",
  AUDITOR: "Read-only across the chain of custody, for compliance review.",
};

const roleColors: Record<UserRole, string> = {
  SYSTEM_ADMIN: "bg-danger",
  ORG_ADMIN: "bg-primary",
  PRODUCTION_MANAGER: "bg-success",
  PRODUCTION_OFFICER: "bg-success",
  WAREHOUSE_MANAGER: "bg-warning-foreground",
  WAREHOUSE_OFFICER: "bg-warning-foreground",
  QUALITY_OFFICER: "bg-info",
  LOGISTICS_OFFICER: "bg-primary",
  SALES_OFFICER: "bg-success",
  MANAGEMENT: "bg-muted",
  AUDITOR: "bg-muted",
};

/** SCREAMING_SNAKE → Title Case, so a new capability needs no table entry. */
function humanise(capability: Capability): string {
  return capability
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * What each role may do.
 *
 * The table is fetched, not hard-coded. An administrator reads this screen and
 * believes it, so it has to be the same table the API enforces — a local copy
 * that drifts is worse than no screen at all, because it quietly documents
 * permissions nobody actually has.
 */
export default function RolesPage() {
  const { data: catalogue, isLoading, error } = useCapabilityCatalogue();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading the permission table…
      </div>
    );
  }

  if (error || !catalogue) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
        <p className="font-medium">Could not load the permission table</p>
        <p className="mt-1 text-muted-foreground">
          {error instanceof Error ? error.message : "Please try again."}
        </p>
      </div>
    );
  }

  const allCapabilities = catalogue.capabilities;
  const descriptions = new Map(
    allCapabilities.map((c) => [c.capability, c.description]),
  );
  const conferred = new Set(
    allCapabilities.filter((c) => c.conferredByStanding).map((c) => c.capability),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <Shield className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Roles &amp; Permissions</h1>
          <p className="text-sm text-muted-foreground">
            What each role may do. This is the table the API enforces, read
            straight from it.
          </p>
        </div>
      </div>

      {/* Capabilities that come from standing rather than from a job title.
          Without this note the role grid looks wrong: nobody appears to hold
          OVERSEE_INDUSTRIES, yet a regulator's auditor does. */}
      {catalogue.standing.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Landmark className="size-4 text-primary" />
              <CardTitle className="text-sm">
                Granted by standing, not by job title
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Some permissions depend on which organization you work for. They
              do not appear in the role grid below, because two people with the
              same title at a manufacturer and at a licensing authority do not
              hold the same ones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {catalogue.standing.map((entry) => (
              <div key={entry.organizationType} className="text-xs">
                <span className="font-mono font-semibold text-foreground">
                  {entry.organizationType}
                </span>
                <span className="text-muted-foreground"> — staff also hold </span>
                {entry.capabilities.map((cap) => (
                  <Badge key={cap} variant="outline" className="ml-1 text-[10px]">
                    {humanise(cap)}
                  </Badge>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {catalogue.roles.map(({ role, capabilities }) => {
          const held = new Set(capabilities);

          return (
            <Card key={role}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div
                    className={`flex size-10 items-center justify-center rounded-lg ${roleColors[role]} text-white`}
                  >
                    <Shield className="size-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {capabilities.length} permissions
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-base">
                  {roleLabels[role] ?? role}
                </CardTitle>
                <CardDescription className="text-xs">
                  {roleDescriptions[role]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {allCapabilities.map(({ capability }) => {
                    const has = held.has(capability);
                    const byStanding = !has && conferred.has(capability);

                    return (
                      <div
                        key={capability}
                        className="flex items-center gap-2 text-xs"
                        title={descriptions.get(capability)}
                      >
                        {has ? (
                          <CheckCircle className="size-3.5 shrink-0 text-success" />
                        ) : byStanding ? (
                          <Landmark className="size-3.5 shrink-0 text-primary/60" />
                        ) : (
                          <XCircle className="size-3.5 shrink-0 text-faint" />
                        )}
                        <span
                          className={
                            has
                              ? "text-foreground"
                              : byStanding
                                ? "text-primary/70"
                                : "text-faint"
                          }
                        >
                          {humanise(capability)}
                          {byStanding && (
                            <span className="ml-1 text-faint">(by standing)</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
