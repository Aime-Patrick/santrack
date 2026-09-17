"use client";

import {
  Building2,
  Package,
  ShoppingCart,
  Truck,
  AlertTriangle,
  DollarSign,
  ClipboardCheck,
  RotateCcw,
  ShieldCheck,
  BarChart3,
  Factory,
  Warehouse,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useExecutiveSummary } from "@/hooks/analytics";
import type { ExecutiveSummary } from "@/services/analytics.service";
import type { OrganizationType, UserRole } from "@/lib/api";

type KPIDefinition = {
  title: string;
  getValue: (summary: ExecutiveSummary | undefined) => string | number;
  getCaption: (summary: ExecutiveSummary | undefined) => string;
  icon: React.ReactNode;
  iconBg: string;
  href: string;
};

const WAREHOUSE_KPIS: KPIDefinition[] = [
  {
    title: "Available Units",
    getValue: (s) => (s?.supplyChain?.availableUnits ?? 0).toLocaleString(),
    getCaption: () => "In stock",
    icon: <Warehouse className="size-4" />,
    iconBg: "bg-primary",
    href: "/dashboard/inventory",
  },
  {
    title: "Stock-Out Products",
    getValue: (s) => s?.supplyChain?.stockOutProducts ?? 0,
    getCaption: () => "Need replenishment",
    icon: <AlertTriangle className="size-4" />,
    iconBg: "bg-danger",
    href: "/dashboard/inventory",
  },
  {
    title: "In Transit",
    getValue: (s) => s?.supplyChain?.inTransitUnits ?? 0,
    getCaption: (s) => `${s?.supplyChain?.inTransitShipments ?? 0} shipments`,
    icon: <Truck className="size-4" />,
    iconBg: "bg-primary",
    href: "/dashboard/logistics/shipments",
  },
  {
    title: "Quarantined",
    getValue: (s) => s?.compliance?.quarantinedItems ?? 0,
    getCaption: () => "Held for review",
    icon: <ShieldCheck className="size-4" />,
    iconBg: "bg-warning-foreground",
    href: "/dashboard/manufacturing/trace",
  },
];

const RETAILER_KPIS: KPIDefinition[] = [
  {
    title: "Products Sold",
    getValue: (s) => s?.market?.productsSold ?? 0,
    getCaption: () => "Units sold",
    icon: <ShoppingCart className="size-4" />,
    iconBg: "bg-primary",
    href: "/dashboard/sales",
  },
  {
    title: "Revenue",
    getValue: (s) => `RWF ${(s?.finance?.revenue ?? 0).toLocaleString()}`,
    getCaption: () => "Total invoiced",
    icon: <DollarSign className="size-4" />,
    iconBg: "bg-success",
    href: "/dashboard/sales?tab=invoices",
  },
  {
    title: "Available Units",
    getValue: (s) => (s?.supplyChain?.availableUnits ?? 0).toLocaleString(),
    getCaption: () => "On hand",
    icon: <Package className="size-4" />,
    iconBg: "bg-primary",
    href: "/dashboard/inventory",
  },
  {
    title: "Active Licenses",
    getValue: (s) => s?.compliance?.activeLicenses ?? 0,
    getCaption: () => "Compliant permits",
    icon: <ShieldCheck className="size-4" />,
    iconBg: "bg-success",
    href: "/dashboard/licenses",
  },
];

const MANUFACTURER_ADMIN_KPIS: KPIDefinition[] = [
  {
    title: "Available Units",
    getValue: (s) => (s?.supplyChain?.availableUnits ?? 0).toLocaleString(),
    getCaption: () => "In stock",
    icon: <Package className="size-4" />,
    iconBg: "bg-primary",
    href: "/dashboard/inventory",
  },
  {
    title: "Distinct Products",
    getValue: (s) => s?.supplyChain?.distinctProducts ?? 0,
    getCaption: () => "Tracked products",
    icon: <Factory className="size-4" />,
    iconBg: "bg-success",
    href: "/dashboard/products",
  },
  {
    title: "Revenue",
    getValue: (s) => `RWF ${(s?.finance?.revenue ?? 0).toLocaleString()}`,
    getCaption: () => "Total invoiced",
    icon: <DollarSign className="size-4" />,
    iconBg: "bg-primary",
    href: "/dashboard/sales?tab=invoices",
  },
  {
    title: "Active Licenses",
    getValue: (s) => s?.compliance?.activeLicenses ?? 0,
    getCaption: () => "Compliant permits",
    icon: <ShieldCheck className="size-4" />,
    iconBg: "bg-success",
    href: "/dashboard/licenses",
  },
];

const ROLE_KPIS: Record<string, KPIDefinition[]> = {
  SYSTEM_ADMIN: MANUFACTURER_ADMIN_KPIS,
  ORG_ADMIN: MANUFACTURER_ADMIN_KPIS,
  PRODUCTION_MANAGER: [
    {
      title: "Tracked Products",
      getValue: (s) => s?.supplyChain?.distinctProducts ?? 0,
      getCaption: () => "In the catalogue",
      icon: <Factory className="size-4" />,
      iconBg: "bg-primary",
      href: "/dashboard/products",
    },
    {
      title: "Raw Materials",
      getValue: (s) => s?.supplyChain?.rawMaterialCount ?? 0,
      getCaption: (s) => `${s?.supplyChain?.lowRawMaterials ?? 0} at or below reorder`,
      icon: <Package className="size-4" />,
      iconBg: "bg-success",
      href: "/dashboard/manufacturing/resources?tab=materials",
    },
    {
      title: "Available Units",
      getValue: (s) => (s?.supplyChain?.availableUnits ?? 0).toLocaleString(),
      getCaption: () => "Ready for dispatch",
      icon: <Warehouse className="size-4" />,
      iconBg: "bg-primary",
      href: "/dashboard/inventory",
    },
    {
      title: "Products Sold",
      getValue: (s) => s?.market?.productsSold ?? 0,
      getCaption: () => "Total units sold",
      icon: <ShoppingCart className="size-4" />,
      iconBg: "bg-success",
      href: "/dashboard/sales",
    },
  ],
  PRODUCTION_OFFICER: [
    {
      title: "Tracked Products",
      getValue: (s) => s?.supplyChain?.distinctProducts ?? 0,
      getCaption: () => "In the catalogue",
      icon: <Factory className="size-4" />,
      iconBg: "bg-primary",
      href: "/dashboard/products",
    },
    {
      title: "Raw Materials",
      getValue: (s) => s?.supplyChain?.rawMaterialCount ?? 0,
      getCaption: (s) => `${s?.supplyChain?.lowRawMaterials ?? 0} at or below reorder`,
      icon: <Package className="size-4" />,
      iconBg: "bg-success",
      href: "/dashboard/manufacturing/resources?tab=materials",
    },
    {
      title: "Available Units",
      getValue: (s) => (s?.supplyChain?.availableUnits ?? 0).toLocaleString(),
      getCaption: () => "Ready for dispatch",
      icon: <Warehouse className="size-4" />,
      iconBg: "bg-primary",
      href: "/dashboard/inventory",
    },
    {
      title: "Products Sold",
      getValue: (s) => s?.market?.productsSold ?? 0,
      getCaption: () => "Total units sold",
      icon: <ShoppingCart className="size-4" />,
      iconBg: "bg-success",
      href: "/dashboard/sales",
    },
  ],
  WAREHOUSE_MANAGER: WAREHOUSE_KPIS,
  WAREHOUSE_OFFICER: WAREHOUSE_KPIS,
  QUALITY_OFFICER: [
    {
      title: "Pending Reviews",
      getValue: (s) => s?.compliance?.pendingReviews ?? 0,
      getCaption: () => "Awaiting inspection",
      icon: <ClipboardCheck className="size-4" />,
      iconBg: "bg-primary",
      href: "/dashboard/manufacturing/quality",
    },
    {
      title: "Quarantined Items",
      getValue: (s) => s?.compliance?.quarantinedItems ?? 0,
      getCaption: () => "Held for review",
      icon: <ShieldCheck className="size-4" />,
      iconBg: "bg-warning-foreground",
      href: "/dashboard/manufacturing/trace",
    },
    {
      title: "Recalled Items",
      getValue: (s) => s?.compliance?.recalledItems ?? 0,
      getCaption: () => "Active recalls",
      icon: <RotateCcw className="size-4" />,
      iconBg: "bg-danger",
      href: "/dashboard/recall",
    },
    {
      title: "Active Licenses",
      getValue: (s) => s?.compliance?.activeLicenses ?? 0,
      getCaption: () => "Compliant",
      icon: <Building2 className="size-4" />,
      iconBg: "bg-success",
      href: "/dashboard/licenses",
    },
  ],
  LOGISTICS_OFFICER: [
    {
      title: "In Transit",
      getValue: (s) => s?.supplyChain?.inTransitUnits ?? 0,
      getCaption: (s) => `${s?.supplyChain?.inTransitShipments ?? 0} shipments`,
      icon: <Truck className="size-4" />,
      iconBg: "bg-primary",
      href: "/dashboard/logistics/shipments",
    },
    {
      title: "Delivered",
      getValue: (s) => s?.market?.productsSold ?? 0,
      getCaption: () => "Completed deliveries",
      icon: <Package className="size-4" />,
      iconBg: "bg-success",
      href: "/dashboard/logistics/shipments",
    },
    {
      title: "Distribution Volumes",
      getValue: (s) => (s?.supplyChain?.distributionVolumes ?? 0).toLocaleString(),
      getCaption: () => "Received transfers",
      icon: <BarChart3 className="size-4" />,
      iconBg: "bg-primary",
      href: "/dashboard/inventory?tab=transfer",
    },
    {
      title: "Available Units",
      getValue: (s) => (s?.supplyChain?.availableUnits ?? 0).toLocaleString(),
      getCaption: () => "In stock",
      icon: <Warehouse className="size-4" />,
      iconBg: "bg-warning-foreground",
      href: "/dashboard/inventory",
    },
  ],
  SALES_OFFICER: RETAILER_KPIS,
  MANAGEMENT: MANUFACTURER_ADMIN_KPIS,
  AUDITOR: [
    {
      title: "Active Licenses",
      getValue: (s) => s?.compliance?.activeLicenses ?? 0,
      getCaption: () => "Compliant",
      icon: <ShieldCheck className="size-4" />,
      iconBg: "bg-success",
      href: "/dashboard/licenses",
    },
    {
      title: "Expired Licenses",
      getValue: (s) => s?.compliance?.expiredLicenses ?? 0,
      getCaption: () => "Need renewal",
      icon: <AlertTriangle className="size-4" />,
      iconBg: "bg-danger",
      href: "/dashboard/licenses",
    },
    {
      title: "Pending Reviews",
      getValue: (s) => s?.compliance?.pendingReviews ?? 0,
      getCaption: () => "Awaiting action",
      icon: <ClipboardCheck className="size-4" />,
      iconBg: "bg-warning-foreground",
      href: "/dashboard/compliance",
    },
    {
      title: "Available Units",
      getValue: (s) => (s?.supplyChain?.availableUnits ?? 0).toLocaleString(),
      getCaption: () => "In stock",
      icon: <Package className="size-4" />,
      iconBg: "bg-primary",
      href: "/dashboard/inventory",
    },
  ],
};

const REGULATOR_KPIS: KPIDefinition[] = [
  {
    title: "Pending Applications",
    getValue: (s) => s?.compliance?.pendingReviews ?? 0,
    getCaption: () => "Awaiting review",
    icon: <ClipboardCheck className="size-4" />,
    iconBg: "bg-primary",
    href: "/dashboard/regulator",
  },
  {
    title: "Active Licences",
    getValue: (s) => s?.compliance?.activeLicenses ?? 0,
    getCaption: () => "In force",
    icon: <ShieldCheck className="size-4" />,
    iconBg: "bg-success",
    href: "/dashboard/regulator",
  },
  {
    title: "Recalled Items",
    getValue: (s) => s?.compliance?.recalledItems ?? 0,
    getCaption: () => "Active recalls",
    icon: <RotateCcw className="size-4" />,
    iconBg: "bg-danger",
    href: "/dashboard/recall",
  },
  {
    title: "Expired Licences",
    getValue: (s) => s?.compliance?.expiredLicenses ?? 0,
    getCaption: () => "Need renewal",
    icon: <AlertTriangle className="size-4" />,
    iconBg: "bg-warning-foreground",
    href: "/dashboard/regulator",
  },
];

/** Prefer the organization's work over a job title that was copied from another sector. */
function kpisFor(
  role: UserRole,
  orgType: OrganizationType | null | undefined,
): KPIDefinition[] {
  if (orgType === "REGULATOR") return REGULATOR_KPIS;
  if (orgType === "WAREHOUSE") return WAREHOUSE_KPIS;
  if (orgType === "RETAILER") return RETAILER_KPIS;
  if (orgType === "DISTRIBUTOR") {
    return [
      {
        title: "Available Units",
        getValue: (s) => (s?.supplyChain?.availableUnits ?? 0).toLocaleString(),
        getCaption: () => "In stock",
        icon: <Package className="size-4" />,
        iconBg: "bg-primary",
        href: "/dashboard/inventory",
      },
      {
        title: "In Transit",
        getValue: (s) => s?.supplyChain?.inTransitUnits ?? 0,
        getCaption: (s) => `${s?.supplyChain?.inTransitShipments ?? 0} shipments`,
        icon: <Truck className="size-4" />,
        iconBg: "bg-primary",
        href: "/dashboard/logistics/shipments",
      },
      {
        title: "Products Sold",
        getValue: (s) => s?.market?.productsSold ?? 0,
        getCaption: () => "Units sold",
        icon: <ShoppingCart className="size-4" />,
        iconBg: "bg-success",
        href: "/dashboard/sales",
      },
      {
        title: "Revenue",
        getValue: (s) => `RWF ${(s?.finance?.revenue ?? 0).toLocaleString()}`,
        getCaption: () => "Total invoiced",
        icon: <DollarSign className="size-4" />,
        iconBg: "bg-success",
        href: "/dashboard/sales?tab=invoices",
      },
    ];
  }
  return ROLE_KPIS[role] ?? MANUFACTURER_ADMIN_KPIS;
}

export function RoleBasedKPIs() {
  const { data: user } = useCurrentUser();
  const { data: summary, isLoading } = useExecutiveSummary();

  const role: UserRole = user?.role ?? "ORG_ADMIN";
  const kpis = kpisFor(role, user?.organization?.type);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <MetricCard
          key={kpi.title}
          title={kpi.title}
          value={isLoading ? "—" : kpi.getValue(summary)}
          icon={kpi.icon}
          iconBg={kpi.iconBg}
          caption={isLoading ? "" : kpi.getCaption(summary)}
          href={kpi.href}
        />
      ))}
    </div>
  );
}
