import type { ComponentType } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Box,
  Building2,
  ClipboardList,
  Factory,
  FileBadge,
  FileSearch,
  Gavel,
  Layers,
  LayoutDashboard,
  List,
  MapPin,
  Megaphone,
  Package,
  PackageOpen,
  PackagePlus,
  Receipt,
  ScanLine,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import type { Capability, OrganizationType } from "@/lib/api";

export interface NavigationAccess {
  requires?: Capability[];
  requiresAny?: Capability[];
  requiresOrganization?: boolean;
  requiresTradingOrg?: boolean;
  /** When set, entry is shown only for these organization types. */
  organizationTypes?: OrganizationType[];
}

export interface NavigationEntry extends NavigationAccess {
  key: string;
  title: string;
  href?: string;
  icon: ComponentType<{ className?: string }>;
  searchKeywords?: string[];
  children?: NavigationChild[];
}

export interface NavigationChild extends NavigationAccess {
  title: string;
  href: string;
  icon?: ComponentType<{ className?: string }>;
  searchKeywords?: string[];
}

export interface NavigationGroup extends NavigationAccess {
  key: string;
  label: string;
  requiresRegulator?: boolean;
  items: NavigationEntry[];
}

export interface SearchPage extends NavigationAccess {
  id: string;
  title: string;
  href: string;
  searchKeywords?: string[];
  featured?: boolean;
}

/**
 * The canonical set of user-facing workspaces.
 *
 * Sidebar and global search both read this registry. Keeping a page here means
 * it is named, discoverable, and capability-gated in the same way everywhere.
 * Detail, dialog, and redirect routes intentionally do not belong here.
 */
export const APP_NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    key: "platform",
    label: "Platform",
    requiresAny: ["ADMINISTER_PLATFORM"],
    items: [
      { key: "dashboard", title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, requires: ["ADMINISTER_PLATFORM"] },
      { key: "users", title: "Users", href: "/dashboard/users", icon: Users, requires: ["ADMINISTER_PLATFORM"] },
      { key: "regulators", title: "Regulators", href: "/dashboard/regulators", icon: ShieldCheck, requires: ["ADMINISTER_PLATFORM"] },
      { key: "announcements", title: "Announcements", href: "/dashboard/announcements", icon: Megaphone, requires: ["PUBLISH_ANNOUNCEMENT"] },
      { key: "audit", title: "Audit logs", href: "/dashboard/audit", icon: ClipboardList, requires: ["READ_AUDIT"] },
    ],
  },
  {
    key: "oversight",
    label: "Oversight",
    requiresAny: ["DECIDE_LICENCES", "OVERSEE_INDUSTRIES"],
    items: [
      { key: "dashboard", title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, requiresAny: ["DECIDE_LICENCES", "OVERSEE_INDUSTRIES"] },
      { key: "license-review", title: "Licence review", href: "/dashboard/regulator", icon: Gavel, requires: ["DECIDE_LICENCES"] },
      {
        key: "industries",
        title: "Industries",
        icon: Building2,
        requires: ["OVERSEE_INDUSTRIES"],
        children: [
          { title: "All industries", href: "/dashboard/industries", icon: List, requires: ["OVERSEE_INDUSTRIES"] },
          { title: "Compliance findings", href: "/dashboard/compliance/findings", icon: AlertTriangle, requires: ["OVERSEE_INDUSTRIES"] },
        ],
      },
      { key: "reg-announcements", title: "Announcements", href: "/dashboard/announcements", icon: Megaphone, requires: ["PUBLISH_ANNOUNCEMENT"] },
    ],
  },
  {
    key: "daily",
    label: "Daily work",
    requiresTradingOrg: true,
    requiresAny: ["RUN_PRODUCTION", "HANDLE_PACKAGING", "MOVE_STOCK", "SELL", "REGISTER_IDENTITY", "PRINT_LABELS", "PERFORM_QC"],
    items: [
      { key: "dashboard-trading", title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, requires: ["VIEW_OPERATIONS"], requiresTradingOrg: true },
      { key: "scan", title: "Scan & trace", href: "/dashboard/manufacturing/trace", icon: ScanLine, requiresAny: ["VIEW_OPERATIONS", "REGISTER_IDENTITY", "MOVE_STOCK"], requiresTradingOrg: true, searchKeywords: ["qr", "barcode", "verify", "traceability"] },
      {
        key: "manufacturing",
        title: "Manufacturing",
        href: "/dashboard/manufacturing",
        icon: Factory,
        requiresAny: ["RUN_PRODUCTION", "PERFORM_QC", "HANDLE_PACKAGING"],
        searchKeywords: ["production", "lot", "batch", "qc", "quality", "package", "pipeline"],
        children: [
          { title: "Resources", href: "/dashboard/manufacturing/resources", icon: Wrench, requiresAny: ["RUN_PRODUCTION", "MANAGE_CATALOG"], searchKeywords: ["machines", "raw materials", "bom", "bill of materials"] },
        ],
      },
      { key: "pos", title: "Point of sale", href: "/dashboard/sales/pos", icon: Receipt, requires: ["SELL"], requiresTradingOrg: true, organizationTypes: ["RETAILER", "SHOP", "DISTRIBUTOR"], searchKeywords: ["sell", "counter sale", "retail", "till"] },
      { key: "labels", title: "Print labels", href: "/dashboard/labels/print", icon: Layers, requires: ["PRINT_LABELS"], searchKeywords: ["qr labels", "label studio"] },
    ],
  },
  {
    key: "inventory",
    label: "Stock & inventory",
    requiresTradingOrg: true,
    requiresAny: ["HANDLE_PACKAGING", "MOVE_STOCK", "REGISTER_IDENTITY", "RUN_PRODUCTION"],
    items: [
      {
        key: "inventory-group",
        title: "Inventory",
        icon: Box,
        requiresAny: ["MOVE_STOCK", "REGISTER_IDENTITY", "RUN_PRODUCTION"],
        children: [
          { title: "Overview", href: "/dashboard/inventory", icon: Box, searchKeywords: ["stock on hand", "available units", "by product"] },
          {
            title: "Receive stock",
            href: "/dashboard/inventory?tab=receive",
            icon: PackageOpen,
            requires: ["MOVE_STOCK"],
            organizationTypes: ["RETAILER", "SHOP"],
            searchKeywords: ["stock in", "receipt", "inbound", "receive transfer"],
          },
          {
            title: "Transfers",
            href: "/dashboard/inventory?tab=transfer",
            icon: ArrowLeftRight,
            requires: ["MOVE_STOCK"],
            organizationTypes: ["MANUFACTURER", "DISTRIBUTOR", "WAREHOUSE"],
            searchKeywords: ["move stock", "dispatch", "transfer"],
          },
          { title: "Declare stock", href: "/dashboard/inventory/opening-stock", icon: PackagePlus, requires: ["REGISTER_IDENTITY"], searchKeywords: ["opening balance", "initial stock"] },
          { title: "Locations", href: "/dashboard/inventory/locations", icon: MapPin, requires: ["MANAGE_CATALOG"], searchKeywords: ["warehouse location", "storage"] },
        ],
      },
    ],
  },
  {
    key: "sales",
    label: "Sales & orders",
    requiresTradingOrg: true,
    requiresAny: ["SELL", "MANAGE_CLIENTS"],
    items: [
      {
        key: "sales-group",
        title: "Sales",
        icon: ShoppingCart,
        requiresAny: ["SELL", "MANAGE_CLIENTS"],
        children: [
          { title: "Sales & orders", href: "/dashboard/sales", icon: ShoppingCart, requires: ["SELL"], searchKeywords: ["quotation", "order", "invoice", "return"] },
          { title: "Customers", href: "/dashboard/sales/customers", icon: Users, requires: ["MANAGE_CLIENTS"] },
          { title: "Purchasing", href: "/dashboard/purchasing", icon: Package, requires: ["MANAGE_CLIENTS"], searchKeywords: ["purchase order", "supplier"] },
        ],
      },
    ],
  },
  {
    key: "logistics",
    label: "Logistics",
    requiresAny: ["MANAGE_LOGISTICS"],
    requiresOrganization: true,
    items: [
      {
        key: "logistics-group",
        title: "Logistics",
        icon: Truck,
        requires: ["MANAGE_LOGISTICS"],
        requiresOrganization: true,
        children: [
          { title: "Shipments & routes", href: "/dashboard/logistics/shipments", icon: Truck, requires: ["MANAGE_LOGISTICS"], searchKeywords: ["dispatch", "delivery", "route"] },
          { title: "Fleet & transporters", href: "/dashboard/logistics/vehicles", icon: Truck, requires: ["MANAGE_LOGISTICS"], searchKeywords: ["vehicle", "transporter", "fleet", "drivers"] },
          { title: "Drivers", href: "/dashboard/logistics/vehicles?tab=drivers", icon: Users, requires: ["MANAGE_LOGISTICS"] },
        ],
      },
    ],
  },
  {
    key: "catalogue",
    label: "Catalogue & setup",
    requiresTradingOrg: true,
    requiresAny: ["MANAGE_CATALOG", "RUN_PRODUCTION", "PERFORM_QC"],
    items: [
      {
        key: "products-group",
        title: "Products & production setup",
        icon: Package,
        requiresAny: ["MANAGE_CATALOG", "RUN_PRODUCTION", "PERFORM_QC"],
        children: [
          { title: "Products", href: "/dashboard/products", icon: Package, requiresAny: ["MANAGE_CATALOG", "RUN_PRODUCTION"], searchKeywords: ["product catalogue", "sku"] },
          { title: "Categories & brands", href: "/dashboard/products/categories", icon: Layers, requires: ["MANAGE_CATALOG"], searchKeywords: ["taxonomy", "brand", "category"] },
          { title: "Manufacturing resources", href: "/dashboard/manufacturing/resources", icon: Wrench, requires: ["MANAGE_CATALOG"], searchKeywords: ["machine", "raw material", "bom", "recipe"] },
          { title: "Quality control", href: "/dashboard/manufacturing/quality", icon: ShieldCheck, requires: ["PERFORM_QC"], searchKeywords: ["inspection", "qc"] },
        ],
      },
    ],
  },
  {
    key: "compliance",
    label: "Compliance",
    requiresTradingOrg: true,
    requiresAny: ["VIEW_OPERATIONS"],
    items: [
      {
        key: "compliance-group",
        title: "Compliance",
        icon: ScrollText,
        requires: ["VIEW_OPERATIONS"],
        requiresTradingOrg: true,
        children: [
          { title: "Overview", href: "/dashboard/compliance", icon: ScrollText, requires: ["VIEW_OPERATIONS"] },
          { title: "Licences & permits", href: "/dashboard/licenses", icon: FileBadge, requires: ["VIEW_OPERATIONS"] },
          { title: "Regulatory cases", href: "/dashboard/compliance/cases", icon: FileSearch, requires: ["VIEW_OPERATIONS"] },
          { title: "Recalls", href: "/dashboard/recall", icon: AlertTriangle, requires: ["VIEW_OPERATIONS"] },
          { title: "Sites", href: "/dashboard/compliance/facilities", icon: Factory, requires: ["MANAGE_CATALOG"] },
        ],
      },
    ],
  },
  {
    key: "intelligence",
    label: "Intelligence",
    requiresTradingOrg: true,
    requiresAny: ["VIEW_OPERATIONS"],
    items: [
      {
        key: "intelligence-group",
        title: "Intelligence",
        icon: BarChart3,
        requiresAny: ["VIEW_OPERATIONS", "READ_AUDIT"],
        requiresTradingOrg: true,
        children: [
          { title: "Analytics & Reports", href: "/dashboard/analytics", icon: BarChart3, requires: ["VIEW_OPERATIONS"], searchKeywords: ["analytics", "reports", "export", "charts", "kpi"] },
          { title: "Audit logs", href: "/dashboard/audit", icon: ClipboardList, requires: ["READ_AUDIT"] },
        ],
      },
    ],
  },
  {
    key: "business-administration",
    label: "Business administration",
    requiresTradingOrg: true,
    requiresAny: ["MANAGE_FINANCE", "MANAGE_PAYROLL"],
    items: [
      {
        key: "finance",
        title: "Finance",
        icon: Wallet,
        requires: ["MANAGE_FINANCE"],
        children: [
          { title: "Accounting", href: "/dashboard/finance/accounts", icon: Wallet, requires: ["MANAGE_FINANCE"], searchKeywords: ["ledger", "accounts", "journal", "budget", "cost centre"] },
          { title: "Finance reports", href: "/dashboard/finance/reports", icon: BarChart3, requires: ["MANAGE_FINANCE"], searchKeywords: ["balance sheet", "profit loss", "trial balance"] },
        ],
      },
      {
        key: "people",
        title: "People & payroll",
        icon: Users,
        requires: ["MANAGE_PAYROLL"],
        children: [
          { title: "People", href: "/dashboard/employees", icon: Users, requires: ["MANAGE_PAYROLL"], searchKeywords: ["employees", "departments", "positions"] },
          { title: "Attendance & leave", href: "/dashboard/employees/attendance", icon: ClipboardList, requires: ["MANAGE_PAYROLL"], searchKeywords: ["timesheet", "absence", "leave"] },
          { title: "Payroll", href: "/dashboard/employees/payroll-runs", icon: Wallet, requires: ["MANAGE_PAYROLL"], searchKeywords: ["pay run", "salary", "payslip"] },
        ],
      },
    ],
  },
];

function pageFromEntry(entry: NavigationEntry | NavigationChild, inherited: NavigationAccess): SearchPage | null {
  if (!entry.href) return null;
  return {
    id: entry.href,
    title: entry.title,
    href: entry.href,
    searchKeywords: entry.searchKeywords,
    requires: entry.requires ?? inherited.requires,
    requiresAny: entry.requiresAny ?? inherited.requiresAny,
    requiresOrganization: entry.requiresOrganization ?? inherited.requiresOrganization,
    requiresTradingOrg: entry.requiresTradingOrg ?? inherited.requiresTradingOrg,
    featured:
      entry.href === "/dashboard" ||
      entry.href === "/dashboard/manufacturing/trace" ||
      entry.href === "/dashboard/sales/pos",
  };
}

/** Pages suitable for command-search. Duplicate links share one result. */
export function navigationSearchPages(): SearchPage[] {
  const pages = new Map<string, SearchPage>();

  for (const group of APP_NAVIGATION_GROUPS) {
    for (const item of group.items) {
      const inherited: NavigationAccess = {
        requiresOrganization: item.requiresOrganization ?? group.requiresOrganization,
        requiresTradingOrg: item.requiresTradingOrg ?? group.requiresTradingOrg,
      };
      const direct = pageFromEntry(item, inherited);
      if (direct && !pages.has(direct.href)) pages.set(direct.href, direct);

      for (const child of item.children ?? []) {
        const page = pageFromEntry(child, {
          ...inherited,
          requires: item.requires,
          requiresAny: item.requiresAny,
        });
        if (page && !pages.has(page.href)) pages.set(page.href, page);
      }
    }
  }

  return [...pages.values()];
}
