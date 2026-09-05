"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Package,
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
  /** Child links are filtered on their own, not just with their parent. */
  requires?: Capability[];
  /** Hide when the caller has no organization ("platform operator"). */
  requiresOrganization?: boolean;
  /**
   * Trading-business screens ("own licences", "org compliance", "ops reports").
   * Hidden for REGULATOR orgs — they supervise industries, they do not apply
   * for their own trading permits.
   */
  requiresTradingOrg?: boolean;
}

interface NavEntry {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  /**
   * Every capability listed must be held.
   *
   * This used to be "any of", which is how a production manager ended up
   * looking at the industry register: the Industries entry asked for
   * MANAGE_CATALOG or ADMINISTER_PLATFORM, and holding the first was enough.
   * "All of" is the safer default — an entry that genuinely accepts
   * alternatives says so with `requiresAny`.
   */
  requires?: Capability[];
  /** At least one of these. For entries a few different roles legitimately reach. */
  requiresAny?: Capability[];
  /** Hide when the caller has no organization ("platform operator"). */
  requiresOrganization?: boolean;
  /** Hide for licensing authorities ("see SubNavEntry"). */
  requiresTradingOrg?: boolean;
  children?: SubNavEntry[];
}

/** Exact path or a nested route under it ("e.g. /products/categories"). */
function pathMatchesHref(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Among sibling links, the longest matching href wins so
 * /inventory/opening-stock highlights Opening Stock, not Inventory.
 */
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
  const isTradingOrg =
    !!me?.organization && me.organization.type !== "REGULATOR";
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const [openSubmenus, setOpenSubmenus] = React.useState<Record<string, boolean>>({
    industries: false,
    manufacturing: false,
    inventory: false,
    employees: false,
    compliance: false,
    regulators: false,
  });

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /**
   * Whether to draw a nav entry.
   *
   * Answered from the capability list the server sent, never recomputed from
   * the role here — a second copy of the rules is what put the industry
   * register in a manufacturer's sidebar.
   */
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

  // ── Platform group ("top section") ──
  const platformNavItems: (NavEntry & { key: string })[] = [
    {
      key: "dashboard",
      title: t("dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
      requires: ["VIEW_OPERATIONS"],
    },
    {
      key: "industries",
      title: t("industries"),
      icon: Building2,
      requires: ["OVERSEE_INDUSTRIES"],
      children: [
        { title: "All Industries", href: "/dashboard/industries", icon: List },
        { title: "Industry compliance", href: "/dashboard/compliance/findings", icon: AlertTriangle },
      ],
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
      key: "license-review",
      title: "License Review",
      href: "/dashboard/regulator",
      icon: FileBadge,
      requires: ["DECIDE_LICENCES"],
    },
  ];

  // ── Scan ("standalone dominant entry") ──
  const scanNavItems: NavEntry[] = [
    {
      title: "Scan",
      href: "/dashboard/manufacturing/trace",
      icon: ScanLine,
      requires: ["VIEW_OPERATIONS"],
    },
  ];

  // ── Work Surface ("exceptions requiring attention") ──
  const workNavItems: (NavEntry & { key: string })[] = [
    {
      key: "recalls",
      title: "Recalls",
      href: "/dashboard/recall",
      icon: AlertTriangle,
      requires: ["VIEW_OPERATIONS"],
      requiresOrganization: true,
    },
    {
      key: "compliance",
      title: "Compliance",
      icon: ScrollText,
      requiresAny: ["DECIDE_LICENCES", "VIEW_OPERATIONS"],
      requiresTradingOrg: true,
      children: [
        { title: "Overview", href: "/dashboard/compliance", icon: ShieldCheck },
        { title: "Findings", href: "/dashboard/compliance/findings", icon: AlertTriangle },
        { title: "Sites", href: "/dashboard/compliance/facilities", icon: Factory },
      ],
    },
    {
      key: "reports",
      title: "Reports",
      href: "/dashboard/reports",
      icon: BarChart3,
      requires: ["VIEW_OPERATIONS"],
      requiresTradingOrg: true,
    },
  ];

  // ── Trace Surface ("lookup and history") ──
  const traceNavItems: (NavEntry & { key: string })[] = [
    {
      key: "licenses",
      title: "Licenses & Permits",
      href: "/dashboard/licenses",
      icon: FileBadge,
      requires: ["VIEW_OPERATIONS"],
      requiresTradingOrg: true,
    },
    {
      key: "analytics",
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
      requires: ["VIEW_OPERATIONS"],
      requiresTradingOrg: true,
    },
    {
      key: "audit",
      title: t("auditLogs"),
      href: "/dashboard/audit",
      icon: ClipboardList,
      requires: ["READ_AUDIT"],
    },
  ];

  // ── Setup Surface ("configure business") ──
  const setupNavItems: (NavEntry & { key: string })[] = [
    {
      key: "manufacturing",
      title: "Manufacturing",
      icon: Factory,
      requiresAny: [
        "MANAGE_CATALOG",
        "REGISTER_IDENTITY",
        "RUN_PRODUCTION",
        "PERFORM_QC",
      ],
      children: [
        { title: "Products", href: "/dashboard/products", icon: Package },
        { title: "Production", href: "/dashboard/manufacturing/production", icon: Factory, requires: ["RUN_PRODUCTION"] },
        { title: "Resources", href: "/dashboard/manufacturing/resources", icon: Wrench, requires: ["RUN_PRODUCTION"] },
        { title: "Quality Control", href: "/dashboard/manufacturing/quality", icon: ShieldCheck, requires: ["PERFORM_QC"] },
      ],
    },
    {
      key: "inventory",
      title: "Stock & Inventory",
      icon: Box,
      requiresAny: ["HANDLE_PACKAGING", "MOVE_STOCK", "REGISTER_IDENTITY", "RUN_PRODUCTION", "MANAGE_LOGISTICS"],
      children: [
        { title: "Inventory", href: "/dashboard/inventory", icon: Box },
        { title: "Opening Stock", href: "/dashboard/inventory/opening-stock", icon: PackagePlus, requires: ["REGISTER_IDENTITY"] },
        { title: "Locations", href: "/dashboard/inventory/locations", icon: MapPin, requires: ["MANAGE_CATALOG"] },
      ],
    },
    {
      key: "sales",
      title: t("salesOrders"),
      icon: ShoppingCart,
      requiresAny: ["SELL", "MANAGE_CLIENTS"],
      children: [
        { title: "Sales", href: "/dashboard/sales", icon: ShoppingCart, requires: ["SELL"] },
        { title: "Customers", href: "/dashboard/sales/customers", icon: Users, requires: ["MANAGE_CLIENTS"] },
        { title: "Purchases", href: "/dashboard/purchasing", icon: Package, requires: ["MANAGE_CLIENTS"] },
      ],
    },
  ];



  // ── Utilities (bottom) ──
  const utilityNavItems: NavEntry[] = [
    {
      title: t("settings"),
      href: "/dashboard/settings",
      icon: Settings,
      requires: ["MANAGE_USERS"],
    },
  ];

  // ── Hidden from default nav (plan §10: not MVP surface) ──
  // Employees/Payroll (MANAGE_PAYROLL), "Finance (MANAGE_FINANCE)",
  // Logistics (MANAGE_LOGISTICS) are accessed through Settings or API only.

  // Menus whose every child is out of reach are dropped rather than shown
  // empty: a heading that opens onto nothing reads as a broken screen.
  const withVisibleChildren = (entry: NavEntry & { key: string }) => ({
    ...entry,
    children: entry.children?.filter((child) => hasAccess(child)),
  });

  const visiblePlatform = platformNavItems
    .filter(hasAccess)
    .map(withVisibleChildren)
    .filter((entry) => !entry.children || entry.children.length > 0);
  const visibleScan = scanNavItems.filter(hasAccess);
  const visibleWork = workNavItems.filter(hasAccess);
  const visibleTrace = traceNavItems.filter(hasAccess);
  const visibleSetup = setupNavItems
    .filter(hasAccess)
    .map(withVisibleChildren)
    .filter((entry) => !entry.children || entry.children.length > 0);
  const visibleUtilities = utilityNavItems.filter(hasAccess);

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
        {/* Platform group */}
        {visiblePlatform.length > 0 && (
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="px-2.5 text-[11px] font-bold text-white/65 uppercase tracking-wider">
              Platform
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1 mt-1">
                {visiblePlatform.map((item) => {
                  const Icon = item.icon;
                  const hasChildren = item.children && item.children.length > 0;
                  const isChildActive = item.children?.some((c) =>
                    pathMatchesHref(pathname, c.href),
                  );
                  const isSubOpen = !!openSubmenus[item.key] || !!isChildActive;
                  const isDirectActive = item.href ? pathname === item.href : false;
                  const isActive = isDirectActive || !!isChildActive;
                  const activeChild = item.children
                    ? activeChildHref(pathname, item.children)
                    : null;

                  if (!hasChildren && item.href) {
                    return (
                      <SidebarMenuItem key={item.key}>
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
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        onClick={() => toggleSubmenu(item.key)}
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
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Scan — dominant entry */}
        {visibleScan.length > 0 && (
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {visibleScan.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.href ? pathname.startsWith(item.href) : false;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        render={<Link href={item.href || "#"} />}
                        className={cn(
                          "h-10 px-3 text-sm font-bold text-white hover:text-white rounded-lg transition-all",
                          isActive
                            ? "bg-white/25 text-white shadow-md"
                            : "bg-white/10 hover:bg-white/18"
                        )}
                      >
                        <Icon className="size-4.5 shrink-0" />
                        <span className="tracking-wide">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Work — exceptions requiring attention */}
        {visibleWork.length > 0 && (
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="px-2.5 text-[11px] font-bold text-white/65 uppercase tracking-wider">
              Work
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1 mt-1">
                {visibleWork.map((item) => {
                  const Icon = item.icon;
                  const hasChildren = item.children && item.children.length > 0;
                  const isChildActive = item.children?.some((c) =>
                    pathMatchesHref(pathname, c.href),
                  );
                  const isSubOpen = !!openSubmenus[item.key] || !!isChildActive;
                  const isDirectActive = item.href ? pathname === item.href : false;
                  const isActive = isDirectActive || !!isChildActive;
                  const activeChild = item.children
                    ? activeChildHref(pathname, item.children)
                    : null;

                  if (!hasChildren && item.href) {
                    return (
                      <SidebarMenuItem key={item.title}>
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
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        onClick={() => toggleSubmenu(item.key ?? item.title)}
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
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Trace — lookup and history */}
        {visibleTrace.length > 0 && (
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="px-2.5 text-[11px] font-bold text-white/65 uppercase tracking-wider">
              Trace
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1 mt-1">
                {visibleTrace.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.href ? pathname.startsWith(item.href) : false;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        render={<Link href={item.href || "#"} />}
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
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Setup — configure business */}
        {visibleSetup.length > 0 && (
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="px-2.5 text-[11px] font-bold text-white/65 uppercase tracking-wider">
              Setup
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1 mt-1">
                {visibleSetup.map((item) => {
                  const Icon = item.icon;
                  const hasChildren = item.children && item.children.length > 0;
                  const isChildActive = item.children?.some((c) =>
                    pathMatchesHref(pathname, c.href),
                  );
                  const isSubOpen = !!openSubmenus[item.key] || !!isChildActive;
                  const isDirectActive = item.href ? pathname === item.href : false;
                  const isActive = isDirectActive || !!isChildActive;
                  const activeChild = item.children
                    ? activeChildHref(pathname, item.children)
                    : null;

                  if (!hasChildren && item.href) {
                    return (
                      <SidebarMenuItem key={item.key}>
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
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        onClick={() => toggleSubmenu(item.key)}
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
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Settings — bottom */}
        <SidebarGroup className="p-0 mt-auto pt-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {visibleUtilities.map((item) => {
                const Icon = item.icon;
                const isActive = item.href ? pathname === item.href : false;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={<Link href={item.href || "#"} />}
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
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
