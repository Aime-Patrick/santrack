"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Package,
  PackageOpen,
  Factory,
  ShoppingCart,
  Users,
  Wrench,
  BarChart3,
  FileBadge,
  ShieldCheck,
  ClipboardList,
  Settings,
  ChevronDown,
  List,
  PackagePlus,
  ScanLine,
  Box,
  MapPin,
  AlertTriangle,
  ScrollText,
  Megaphone,
  Truck,
  ArrowLeftRight,
  Receipt,
  FileSearch,
  Gavel,
  Layers,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCapabilities } from "@/hooks/permissions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { type Capability } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface SubNavEntry {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  requires?: Capability[];
  requiresOrganization?: boolean;
  requiresTradingOrg?: boolean;
}

interface NavEntry {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  requires?: Capability[];
  requiresAny?: Capability[];
  requiresOrganization?: boolean;
  requiresTradingOrg?: boolean;
  children?: SubNavEntry[];
}

interface NavGroup {
  key: string;
  label: string;
  /** If set, only shown when user has at least one of these. */
  requiresAny?: Capability[];
  /** Only for trading businesses (not regulator). */
  requiresTradingOrg?: boolean;
  /** Only for regulator / overseer. */
  requiresRegulator?: boolean;
  /** Only shown when user has an organization. */
  requiresOrganization?: boolean;
  items: (NavEntry & { key: string })[];
}

function pathMatchesHref(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

function activeChildHref(
  pathname: string,
  children: { href: string }[],
): string | null {
  const matches = children.filter((c) => pathMatchesHref(pathname, c.href));
  if (matches.length === 0) return null;
  return matches.reduce((best, c) =>
    c.href.length > best.href.length ? c : best,
  ).href;
}

export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations("sidebar");
  const permissions = useCapabilities();
  const { data: me } = useCurrentUser();
  const hasOrganization = !!me?.organization;
  const orgType = me?.organization?.type ?? null;
  const isRegulator = orgType === "REGULATOR";
  const isTradingOrg = hasOrganization && !isRegulator;
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const [openSubmenus, setOpenSubmenus] = React.useState<Record<string, boolean>>({});

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasAccess = (entry: {
    requires?: Capability[];
    requiresAny?: Capability[];
    requiresOrganization?: boolean;
    requiresTradingOrg?: boolean;
  }) => {
    if (permissions.loading) return false;
    if (entry.requiresOrganization && !hasOrganization) return false;
    if (entry.requiresTradingOrg && !isTradingOrg) return false;
    if (entry.requires && !permissions.canAll(entry.requires)) return false;
    if (entry.requiresAny && !permissions.canAny(entry.requiresAny)) return false;
    return true;
  };

  // ---------------------------------------------------------------------------
  // Nav groups — ordered by what each persona needs FIRST.
  //
  // Regulator sees: Oversight → Licences → Intelligence → Settings
  // Manufacturer sees: Production → Inventory → Compliance → Trace → Settings
  // Sales / Warehouse / Logistics see their primary work surface first.
  // System Admin sees: Platform → Industries → Settings
  // ---------------------------------------------------------------------------

  const allGroups: NavGroup[] = [

    // ── 1. PLATFORM ADMIN (System Admin only) ────────────────────────────────
    {
      key: "platform",
      label: "Platform",
      requiresAny: ["ADMINISTER_PLATFORM"],
      items: [
        {
          key: "dashboard",
          title: t("dashboard"),
          href: "/dashboard",
          icon: LayoutDashboard,
          requires: ["ADMINISTER_PLATFORM"],
        },
        {
          key: "users",
          title: "Users",
          href: "/dashboard/users",
          icon: Users,
          requires: ["ADMINISTER_PLATFORM"],
        },
        {
          key: "regulators",
          title: "Regulators",
          href: "/dashboard/regulators",
          icon: ShieldCheck,
          requires: ["ADMINISTER_PLATFORM"],
        },
        {
          key: "announcements",
          title: "Announcements",
          href: "/dashboard/announcements",
          icon: Megaphone,
          requires: ["PUBLISH_ANNOUNCEMENT"],
        },
        {
          key: "audit",
          title: t("auditLogs"),
          href: "/dashboard/audit",
          icon: ClipboardList,
          requires: ["READ_AUDIT"],
        },
      ],
    },

    // ── 2. REGULATOR — primary work surface ──────────────────────────────────
    // First thing a regulator opens every morning: pending applications + industries.
    {
      key: "oversight",
      label: "Oversight",
      requiresAny: ["DECIDE_LICENCES", "OVERSEE_INDUSTRIES"],
      items: [
        {
          key: "dashboard",
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          requiresAny: ["DECIDE_LICENCES", "OVERSEE_INDUSTRIES"],
        },
        {
          key: "license-review",
          title: "Licence Review",
          href: "/dashboard/regulator",
          icon: Gavel,
          requires: ["DECIDE_LICENCES"],
        },
        {
          key: "industries",
          title: "Industries",
          icon: Building2,
          requiresAny: ["OVERSEE_INDUSTRIES"],
          children: [
            { title: "All Industries", href: "/dashboard/industries", icon: List },
            { title: "Compliance Findings", href: "/dashboard/compliance/findings", icon: AlertTriangle, requires: ["OVERSEE_INDUSTRIES"] },
          ],
        },
        {
          key: "reg-announcements",
          title: "Announcements",
          href: "/dashboard/announcements",
          icon: Megaphone,
          requires: ["PUBLISH_ANNOUNCEMENT"],
        },
      ],
    },

    // ── 3. DAILY WORK — what a trading org acts on every day ─────────────────
    // For manufacturers: production + scan. For sales: POS + orders. For
    // warehouse: stock moves. Shown above everything else for these roles.
    {
      key: "daily",
      label: "Daily Work",
      requiresTradingOrg: true,
      requiresAny: [
        "RUN_PRODUCTION",
        "HANDLE_PACKAGING",
        "MOVE_STOCK",
        "SELL",
        "REGISTER_IDENTITY",
        "PRINT_LABELS",
      ],
      items: [
        {
          key: "dashboard-trading",
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          requires: ["VIEW_OPERATIONS"],
          requiresTradingOrg: true,
        },
        // Scan — the most-used single action for floor workers
        {
          key: "scan",
          title: "Scan & Trace",
          href: "/dashboard/manufacturing/trace",
          icon: ScanLine,
          requiresAny: ["VIEW_OPERATIONS", "REGISTER_IDENTITY", "MOVE_STOCK"],
          requiresTradingOrg: true,
        },
        // Production (manufacturers)
        {
          key: "production",
          title: "Production",
          href: "/dashboard/manufacturing/production",
          icon: Factory,
          requires: ["RUN_PRODUCTION"],
        },
        // POS (retail / sales front-line)
        {
          key: "pos",
          title: "Point of Sale",
          href: "/dashboard/sales/pos",
          icon: Receipt,
          requires: ["SELL"],
          requiresTradingOrg: true,
        },
        // Labels
        {
          key: "labels",
          title: "Print Labels",
          href: "/dashboard/labels/print",
          icon: Layers,
          requires: ["PRINT_LABELS"],
        },
      ],
    },

    // ── 4. INVENTORY & STOCK ─────────────────────────────────────────────────
    // Warehouse managers and officers land here first after Dashboard.
    {
      key: "inventory",
      label: "Stock & Inventory",
      requiresTradingOrg: true,
      requiresAny: ["HANDLE_PACKAGING", "MOVE_STOCK", "REGISTER_IDENTITY", "RUN_PRODUCTION"],
      items: [
        {
          key: "inventory-main",
          title: "Inventory",
          href: "/dashboard/inventory",
          icon: Box,
          requiresAny: ["MOVE_STOCK", "REGISTER_IDENTITY", "RUN_PRODUCTION"],
        },
        {
          key: "stock-in",
          title: "Stock In",
          href: "/dashboard/inventory/stock-in",
          icon: PackageOpen,
          requires: ["MOVE_STOCK"],
        },
        {
          key: "stock-movement",
          title: "Stock Movement",
          href: "/dashboard/inventory/movements",
          icon: ArrowLeftRight,
          requires: ["MOVE_STOCK"],
        },
        {
          key: "opening-stock",
          title: "Opening Stock",
          href: "/dashboard/inventory/opening-stock",
          icon: PackagePlus,
          requires: ["REGISTER_IDENTITY"],
        },
        {
          key: "locations",
          title: "Locations",
          href: "/dashboard/inventory/locations",
          icon: MapPin,
          requires: ["MANAGE_CATALOG"],
        },
      ],
    },

    // ── 5. SALES & ORDERS ────────────────────────────────────────────────────
    {
      key: "sales",
      label: "Sales & Orders",
      requiresTradingOrg: true,
      requiresAny: ["SELL", "MANAGE_CLIENTS"],
      items: [
        {
          key: "sales-main",
          title: "Sales",
          href: "/dashboard/sales",
          icon: ShoppingCart,
          requires: ["SELL"],
        },
        {
          key: "customers",
          title: "Customers",
          href: "/dashboard/sales/customers",
          icon: Users,
          requires: ["MANAGE_CLIENTS"],
        },
        {
          key: "purchases",
          title: "Purchases",
          href: "/dashboard/purchasing",
          icon: Package,
          requires: ["MANAGE_CLIENTS"],
        },
      ],
    },

    // ── 6. LOGISTICS ─────────────────────────────────────────────────────────
    {
      key: "logistics",
      label: "Logistics",
      requiresAny: ["MANAGE_LOGISTICS"],
      requiresOrganization: true,
      items: [
        {
          key: "shipments",
          title: "Shipments",
          href: "/dashboard/logistics/shipments",
          icon: Truck,
          requires: ["MANAGE_LOGISTICS"],
          requiresOrganization: true,
        },
        {
          key: "vehicles",
          title: "Vehicles",
          href: "/dashboard/logistics/vehicles",
          icon: Truck,
          requires: ["MANAGE_LOGISTICS"],
          requiresOrganization: true,
        },
        {
          key: "drivers",
          title: "Drivers",
          href: "/dashboard/logistics/drivers",
          icon: Users,
          requires: ["MANAGE_LOGISTICS"],
          requiresOrganization: true,
        },
      ],
    },

    // ── 7. CATALOGUE & MANUFACTURING CONFIG ──────────────────────────────────
    // Products and production setup — less frequent than daily ops.
    {
      key: "catalogue",
      label: "Catalogue",
      requiresTradingOrg: true,
      requiresAny: ["MANAGE_CATALOG", "RUN_PRODUCTION", "PERFORM_QC"],
      items: [
        {
          key: "products",
          title: "Products",
          href: "/dashboard/products",
          icon: Package,
          requiresAny: ["MANAGE_CATALOG", "RUN_PRODUCTION"],
        },
        {
          key: "resources",
          title: "Resources",
          href: "/dashboard/manufacturing/resources",
          icon: Wrench,
          requires: ["RUN_PRODUCTION"],
        },
        {
          key: "quality",
          title: "Quality Control",
          href: "/dashboard/manufacturing/quality",
          icon: ShieldCheck,
          requires: ["PERFORM_QC"],
        },
      ],
    },

    // ── 8. COMPLIANCE & LICENSING ────────────────────────────────────────────
    // Licences + recalls + compliance — important but not opened every minute.
    {
      key: "compliance",
      label: "Compliance",
      requiresTradingOrg: true,
      requiresAny: ["VIEW_OPERATIONS"],
      items: [
        {
          key: "licenses",
          title: "Licences & Permits",
          href: "/dashboard/licenses",
          icon: FileBadge,
          requires: ["VIEW_OPERATIONS"],
          requiresTradingOrg: true,
        },
        {
          key: "compliance-overview",
          title: "Compliance",
          href: "/dashboard/compliance",
          icon: ScrollText,
          requiresAny: ["VIEW_OPERATIONS"],
          requiresTradingOrg: true,
        },
        {
          key: "cases",
          title: "Regulatory Cases",
          href: "/dashboard/compliance/cases",
          icon: FileSearch,
          requiresAny: ["VIEW_OPERATIONS"],
          requiresTradingOrg: true,
        },
        {
          key: "recalls",
          title: "Recalls",
          href: "/dashboard/recall",
          icon: AlertTriangle,
          requires: ["VIEW_OPERATIONS"],
          requiresOrganization: true,
        },
        {
          key: "sites",
          title: "Sites",
          href: "/dashboard/compliance/facilities",
          icon: Factory,
          requires: ["MANAGE_CATALOG"],
          requiresTradingOrg: true,
        },
      ],
    },

    // ── 9. INTELLIGENCE ──────────────────────────────────────────────────────
    // Reports and analytics — opened less frequently, sits lower.
    {
      key: "intelligence",
      label: "Intelligence",
      requiresTradingOrg: true,
      requiresAny: ["VIEW_OPERATIONS"],
      items: [
        {
          key: "analytics",
          title: "Analytics",
          href: "/dashboard/analytics",
          icon: BarChart3,
          requires: ["VIEW_OPERATIONS"],
          requiresTradingOrg: true,
        },
        {
          key: "reports",
          title: "Reports",
          href: "/dashboard/reports",
          icon: BarChart3,
          requires: ["VIEW_OPERATIONS"],
          requiresTradingOrg: true,
        },
        {
          key: "audit-trading",
          title: t("auditLogs"),
          href: "/dashboard/audit",
          icon: ClipboardList,
          requires: ["READ_AUDIT"],
          requiresTradingOrg: true,
        },
      ],
    },
  ];

  // Evaluate group-level visibility
  const isGroupVisible = (group: NavGroup): boolean => {
    if (permissions.loading) return false;
    if (group.requiresTradingOrg && !isTradingOrg) return false;
    if (group.requiresRegulator && !isRegulator) return false;
    if (group.requiresOrganization && !hasOrganization) return false;
    if (group.requiresAny && !permissions.canAny(group.requiresAny)) return false;
    // suppress the group entirely if none of its items are accessible
    return true;
  };

  // Deduplicate Dashboard entry: only the first group that renders it should show it.
  // We track whether we've already added Dashboard to avoid showing it twice.
  let dashboardRendered = false;

  const resolvedGroups = allGroups
    .filter(isGroupVisible)
    .map((group) => {
      const visibleItems = group.items
        .filter(hasAccess)
        .filter((item) => {
          // Deduplicate the Dashboard link — show it only once across all groups
          if (item.href === "/dashboard" && item.key.startsWith("dashboard")) {
            if (dashboardRendered) return false;
            dashboardRendered = true;
          }
          return true;
        })
        .map((item) => ({
          ...item,
          children: item.children?.filter((child) => hasAccess(child)),
        }))
        .filter((item) => !item.children || item.children.length > 0);

      return { ...group, items: visibleItems };
    })
    .filter((group) => group.items.length > 0);

  // Settings always appears at the bottom, never deduplicated
  const showSettings = hasAccess({ requires: ["MANAGE_USERS"] });

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-none bg-rwanda-blue text-white">
      {/* ── Header ── */}
      <SidebarHeader className="p-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 py-1 rounded-lg transition-opacity hover:opacity-90 cursor-pointer"
        >
          <img
            src="/images/logo-symbol.png"
            alt="SANTRACK"
            className="size-9.5 shrink-0 drop-shadow-md"
          />
          <div className="flex flex-col leading-none group-data-[state=collapsed]:hidden">
            <div className="flex items-center gap-1 leading-none">
              <span className="font-extrabold text-white text-base tracking-tight">SAN</span>
              <span className="font-extrabold text-rwanda-yellow text-base tracking-tight">TRACK</span>
            </div>
            <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-white/80 mt-1">
              Industry Management
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* ── Content ── */}
      <SidebarContent className="px-2 py-2 space-y-4">
        {resolvedGroups.map((group) => (
          <SidebarGroup key={group.key} className="p-0">
            <SidebarGroupLabel className="px-2.5 text-[11px] font-bold text-white/65 uppercase tracking-wider">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1 mt-1">
                {group.items.map((item) => (
                  <NavItem
                    key={item.key}
                    item={item}
                    pathname={pathname}
                    isCollapsed={isCollapsed}
                    isOpen={!!openSubmenus[item.key]}
                    onToggle={() => toggleSubmenu(item.key)}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Settings — always pinned at the bottom */}
        {showSettings && (
          <SidebarGroup className="p-0 mt-auto">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname.startsWith("/dashboard/settings")}
                    tooltip={t("settings")}
                    render={<Link href="/dashboard/settings" />}
                    className={cn(
                      "h-9 px-2.5 text-sm font-medium text-white/85 hover:text-white hover:bg-white/12 transition-colors rounded-lg",
                      pathname.startsWith("/dashboard/settings") && "bg-white/20 text-white font-bold shadow-xs"
                    )}
                  >
                    <Settings className="size-4 shrink-0 text-white/80 group-hover/menu-button:text-white" />
                    <span>{t("settings")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

// ---------------------------------------------------------------------------
// NavItem — renders a single entry, with or without children
// ---------------------------------------------------------------------------

function NavItem({
  item,
  pathname,
  isCollapsed,
  isOpen,
  onToggle,
}: {
  item: NavEntry & { key: string };
  pathname: string;
  isCollapsed: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = item.icon;
  const hasChildren = !!item.children && item.children.length > 0;
  const isChildActive = item.children?.some((c) => pathMatchesHref(pathname, c.href)) ?? false;
  const isSubOpen = isOpen || isChildActive;
  const isDirectActive = item.href ? pathname === item.href : false;
  const isActive = isDirectActive || isChildActive;
  const activeChild = item.children ? activeChildHref(pathname, item.children) : null;

  if (!hasChildren && item.href) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive}
          tooltip={item.title}
          render={<Link href={item.href} />}
          className={cn(
            "h-9 px-2.5 text-sm font-medium text-white/85 hover:text-white hover:bg-white/12 transition-colors rounded-lg",
            isActive && "bg-white/20 text-white font-bold shadow-xs"
          )}
        >
          <Icon className="size-4 shrink-0 text-white/80 group-hover/menu-button:text-white" />
          <span>{item.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={item.title}
        onClick={onToggle}
        className={cn(
          "h-9 px-2.5 text-sm font-medium text-white/85 hover:text-white hover:bg-white/12 transition-colors rounded-lg justify-between",
          isActive && "text-white font-semibold bg-white/10"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className="size-4 shrink-0 text-white/80 group-hover/menu-button:text-white" />
          <span className="truncate">{item.title}</span>
        </div>
        <ChevronDown
          className={cn(
            "size-3.5 text-white/70 transition-transform duration-200 shrink-0",
            isSubOpen && "rotate-180"
          )}
        />
      </SidebarMenuButton>

      {isSubOpen && !isCollapsed && item.children && (
        <SidebarMenuSub className="ml-5 mt-1 border-l-2 border-white/25 pl-2 space-y-0.5">
          {item.children.map((child) => {
            const isCurrent = child.href === activeChild;
            const ChildIcon = child.icon;
            return (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton
                  isActive={isCurrent}
                  render={<Link href={child.href} />}
                  className={cn(
                    "h-7.5 px-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors rounded-md",
                    isCurrent && "bg-white/25 text-white font-bold"
                  )}
                >
                  {ChildIcon && <ChildIcon className="size-3.5 shrink-0 opacity-80" />}
                  <span>{child.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}
