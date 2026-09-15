"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCapabilities } from "@/hooks/permissions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useExecutiveSummary } from "@/hooks/analytics";
import { useBatches } from "@/hooks/batches";
import { useMyLicenses } from "@/hooks/licensing";
import { useIncomingTransfers } from "@/hooks/transfers";
import type { Capability, OrganizationType } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type WorkAction = {
  title: string;
  description: string;
  href: string;
  capability: Capability;
  emphasis?: string;
};

function receiveHref(orgType: OrganizationType | undefined | null): string {
  // Retailers/shops confirm inbound stock on Inventory → Receive.
  // Everyone else dispatches and confirms on Inventory → Transfers.
  if (orgType === "RETAILER" || orgType === "SHOP") {
    return "/dashboard/inventory?tab=receive";
  }
  return "/dashboard/inventory?tab=transfer";
}

function sellHref(orgType: OrganizationType | undefined | null): string {
  // Counter staff land on POS; office sales land on the orders workspace.
  if (orgType === "RETAILER" || orgType === "SHOP") {
    return "/dashboard/sales/pos";
  }
  return "/dashboard/sales";
}

const ACTION_ORDER: Record<string, string[]> = {
  MANUFACTURER: ["produce", "quality", "package", "scan", "receive"],
  WAREHOUSE: ["receive", "scan", "shipments"],
  DISTRIBUTOR: ["receive", "sell", "shipments", "scan"],
  RETAILER: ["sell", "receive", "scan"],
  SHOP: ["sell", "receive", "scan"],
  REGULATOR: ["scan"],
};

export function ContinueWork() {
  const permissions = useCapabilities();
  const { data: user } = useCurrentUser();
  const organizationType = user?.organization?.type;
  const isTradingOrg = !!user?.organization && organizationType !== "REGULATOR";
  const canViewOperations = permissions.can("VIEW_OPERATIONS");
  const canRunProduction = permissions.can("RUN_PRODUCTION");
  const canMoveStock = permissions.can("MOVE_STOCK");
  const canHandlePackaging = permissions.can("HANDLE_PACKAGING");
  const canManageCatalogue = permissions.can("MANAGE_CATALOG");

  const { data: batches } = useBatches(undefined, {
    enabled: isTradingOrg && (canRunProduction || canHandlePackaging || permissions.can("PERFORM_QC")),
  });
  const { data: incomingTransfers } = useIncomingTransfers(true, 0, 1, {
    enabled: isTradingOrg && canMoveStock,
  });
  const { data: licences } = useMyLicenses({
    enabled: isTradingOrg && canViewOperations,
  });
  const { data: summary } = useExecutiveSummary({
    enabled: isTradingOrg && canManageCatalogue,
  });

  const pendingQuality = batches?.filter((batch) => batch.status === "PENDING_QC").length ?? 0;
  const approvedLots = batches?.filter((batch) => batch.status === "APPROVED").length ?? 0;
  const attentionLicences =
    licences?.filter((licence) =>
      ["DRAFT", "EXPIRED", "SUSPENDED", "REJECTED"].includes(licence.status),
    ).length ?? 0;
  const lowMaterials = summary?.supplyChain.lowRawMaterials ?? 0;
  const incomingCount = incomingTransfers?.totalElements ?? 0;

  const actionsCatalog: Record<string, WorkAction> = {
    scan: {
      title: "Scan or trace a product",
      description: "Look up a QR code and see where it stands.",
      href: "/dashboard/manufacturing/trace",
      capability: "VIEW_OPERATIONS",
    },
    produce: {
      title: "Run production",
      description: "Create, start, or finish a production order.",
      href: "/dashboard/manufacturing",
      capability: "RUN_PRODUCTION",
    },
    quality: {
      title: "Complete quality checks",
      description: "Record a verdict for lots waiting for inspection.",
      href: "/dashboard/manufacturing",
      capability: "PERFORM_QC",
    },
    package: {
      title: "Register approved lots",
      description: "Assign identities and pack lots that passed QC.",
      href: "/dashboard/manufacturing",
      capability: "HANDLE_PACKAGING",
    },
    receive: {
      title: "Receive stock",
      description: "Confirm incoming transfers and put goods into stock.",
      href: receiveHref(organizationType),
      capability: "MOVE_STOCK",
    },
    sell: {
      title: "Make a sale",
      description:
        organizationType === "RETAILER" || organizationType === "SHOP"
          ? "Open the counter and sell scanned stock."
          : "Record a sale or continue an open order.",
      href: sellHref(organizationType),
      capability: "SELL",
    },
    shipments: {
      title: "Manage shipments",
      description: "Plan dispatches, routes, and deliveries.",
      href: "/dashboard/logistics/shipments",
      capability: "MANAGE_LOGISTICS",
    },
    finance: {
      title: "Manage accounting",
      description: "Review the ledger, journal, budgets, and cost centres.",
      href: "/dashboard/finance/accounts",
      capability: "MANAGE_FINANCE",
    },
    payroll: {
      title: "Manage people & payroll",
      description: "Maintain employees, attendance, and pay runs.",
      href: "/dashboard/employees",
      capability: "MANAGE_PAYROLL",
    },
    materials: {
      title: "Review raw materials",
      description: "Check levels and update production resources.",
      href: "/dashboard/manufacturing/resources?tab=materials",
      capability: "MANAGE_CATALOG",
    },
    licences: {
      title: "Resolve licence status",
      description: "Review licences that expired or need action.",
      href: "/dashboard/licenses",
      capability: "VIEW_OPERATIONS",
    },
  };

  const stateActionCandidates: Array<WorkAction | null> = [
    pendingQuality > 0 && permissions.can("PERFORM_QC")
      ? {
          ...actionsCatalog.quality,
          emphasis: `${pendingQuality} ${pendingQuality === 1 ? "lot" : "lots"} waiting for a verdict`,
        }
      : null,
    approvedLots > 0 && canHandlePackaging
      ? {
          ...actionsCatalog.package,
          emphasis: `${approvedLots} approved ${approvedLots === 1 ? "lot" : "lots"} ready for packaging`,
        }
      : null,
    incomingCount > 0 && canMoveStock
      ? {
          ...actionsCatalog.receive,
          emphasis: `${incomingCount} incoming ${incomingCount === 1 ? "transfer" : "transfers"} awaiting receipt`,
        }
      : null,
    attentionLicences > 0 && canViewOperations
      ? {
          ...actionsCatalog.licences,
          emphasis: `${attentionLicences} ${attentionLicences === 1 ? "licence" : "licences"} need attention`,
        }
      : null,
    lowMaterials > 0 && canManageCatalogue
      ? {
          ...actionsCatalog.materials,
          emphasis: `${lowMaterials} ${lowMaterials === 1 ? "material" : "materials"} at or below reorder level`,
        }
      : null,
  ];
  const stateActions = stateActionCandidates.filter(
    (action): action is WorkAction => action !== null,
  );

  const orderedKeys = [
    ...(ACTION_ORDER[organizationType ?? ""] ?? ["scan"]),
    "finance",
    "payroll",
  ];
  const defaultActions = [...new Set(orderedKeys)]
    .map((key) => actionsCatalog[key])
    .filter((action): action is WorkAction => !!action && permissions.can(action.capability))
    .filter((action) => !stateActions.some((stateAction) => stateAction.href === action.href && stateAction.title === action.title));
  const actions = [...stateActions, ...defaultActions].slice(0, 3);

  if (permissions.loading || actions.length === 0) return null;

  return (
    <Card size="sm" className="border-primary/15 bg-gradient-to-br from-primary/[0.035] to-white">
      <CardHeader className="gap-0.5 pb-0">
        <CardTitle className="text-sm">Continue work</CardTitle>
        <CardDescription className="text-[11px] leading-snug">
          Urgent items first, then your usual next steps.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={`${action.capability}:${action.title}`}
            href={action.href}
            className="group flex items-start gap-2 rounded-lg border border-border/80 bg-white px-2.5 py-2 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{action.title}</p>
              <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-muted-foreground">{action.description}</p>
              {action.emphasis ? (
                <p className="mt-1 truncate text-[11px] font-semibold text-primary">{action.emphasis}</p>
              ) : null}
            </div>
            <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
