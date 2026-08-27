"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Package,
  Tags,
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
  PlusCircle,
  List,
  Hash,
  PackagePlus,
  PackageCheck,
  QrCode,
  ScanLine,
  Truck,
  ArrowRightLeft,
  Box,
  Clock,
  FileText,
  Receipt,
  Layers,
  Calendar,
  Wallet,
  MapPin,
  AlertTriangle,
  PlayCircle,
  ScrollText,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCapabilities } from "@/hooks/permissions";
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
  children?: SubNavEntry[];
}

/** Exact path or a nested route under it (e.g. /products/categories). */
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
  }) => {
    if (permissions.loading) return false;
    if (entry.requires && !permissions.canAll(entry.requires)) return false;
    if (entry.requiresAny && !permissions.canAny(entry.requiresAny)) return false;
    return true;
  };

  // ── Platform Group ──
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
      // The register of every business on the platform. Proposal section 3
      // puts industry registration and supervision with the licensing
      // authorities, so this belongs to them and to the platform operator —
      // not to a manufacturer's staff, however senior. Registering a business
      // is stricter still, hence the child requirement below.
      requires: ["OVERSEE_INDUSTRIES"],
      children: [
        { title: "All Industries", href: "/dashboard/industries", icon: List },
      ],
    },
    {
      key: "manufacturing",
      title: "Manufacturing",
      icon: Factory,
      // Consolidated place-based navigation:
      // - Products: Catalog, pools, batches, labels
      // - Production: Orders, runs, claim codes, QC, confirm
      // - Resources: Machines, Raw Materials, BOMs
      // - Quality: QC inspection verdicts
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
      // Stock & Inventory is a manufacturer concern. Regulators hold only
      // VIEW_OPERATIONS + OVERSEE_INDUSTRIES; they must not see this section.
      // Requiring at least one physical-operations capability ensures only
      // manufacturing/warehouse/logistics roles see the menu.
      requiresAny: ["HANDLE_PACKAGING", "MOVE_STOCK", "REGISTER_IDENTITY", "RUN_PRODUCTION", "MANAGE_LOGISTICS"],
      // Inventory Overview and Items answered the same question from the same
      // rows, so they are one destination with two tabs. Register, pack and
      // transfer are verbs that act on stock, so they are buttons on that
      // destination rather than places of their own.
      //
      // Opening Stock stays a destination: adopting an existing warehouse is a
      // journey a business walks once, not an action on stock already here.
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
      // Recording a sale and running a customer account are different
      // capabilities on the API, and the children say which is which.
      requiresAny: ["SELL", "MANAGE_CLIENTS"],
      // Quotation -> order -> invoice -> return is one document moving through
      // four stages, so it is one destination with four tabs. As four menu
      // entries it read as four unrelated places, and somebody chasing a deal
      // had to know which one held the stage it had reached.
      //
      // Customers stays separate because it is a different subject: people the
      // business deals with, not documents it issues them.
      children: [
        { title: "Sales", href: "/dashboard/sales", icon: ShoppingCart, requires: ["SELL"] },
        { title: "Customers", href: "/dashboard/sales/customers", icon: Users, requires: ["MANAGE_CLIENTS"] },
        { title: "Purchases", href: "/dashboard/purchasing", icon: Package, requires: ["MANAGE_CLIENTS"] },
      ],
    },
    {
      key: "employees",
      title: t("employees"),
      icon: Users,
      // Payroll, not user administration. These screens are the HR record —
      // employees, attendance, leave, pay runs — and the API guards every one
      // of them with MANAGE_PAYROLL. Asking for MANAGE_USERS here showed the
      // whole menu to anyone who could add a login, and then every page inside
      // it returned 403.
      requires: ["MANAGE_PAYROLL"],
      // Three different jobs were sharing this heading: the HR record, daily
      // time-keeping, and monthly payroll. They are used by different people at
      // different rhythms — attendance daily, payroll monthly, job positions
      // twice a year — so flattening them into one list of eight made the daily
      // task exactly as hard to find as the annual one.
      children: [
        { title: "People", href: "/dashboard/employees", icon: Users },
        { title: "Time", href: "/dashboard/employees/attendance", icon: Clock },
        { title: "Payroll", href: "/dashboard/employees/payroll-runs", icon: Wallet },
      ],
    },
    {
      key: "finance",
      title: "Finance",
      icon: Wallet,
      // The ledger. VIEW_OPERATIONS is held by every role including the
      // warehouse floor, so asking for it here put the chart of accounts in
      // everyone's sidebar.
      requires: ["MANAGE_FINANCE"],
      // Accounts, journal, budgets and cost centres are one ledger seen four
      // ways, and a posting gets checked against all four. Reports stays its
      // own place: it answers questions about the books rather than keeping
      // them.
      children: [
        { title: "Accounting", href: "/dashboard/finance/accounts", icon: Wallet },
        { title: "Reports", href: "/dashboard/finance/reports", icon: BarChart3 },
      ],
    },
    {
      key: "logistics",
      title: "Logistics",
      icon: Truck,
      requires: ["MANAGE_LOGISTICS"],
      // Who can carry this (fleet) and what is being carried (shipments) are
      // the two questions logistics actually asks. Five entries made them look
      // like five.
      children: [
        { title: "Fleet", href: "/dashboard/logistics/vehicles", icon: Truck },
        { title: "Shipments", href: "/dashboard/logistics/shipments", icon: Package },
      ],
    },
    {
      key: "compliance",
      title: "Compliance",
      icon: ScrollText,
      // Where the business stands against its licences, and the sites it
      // operates. Both screens render what the server decided — the browser
      // works out no part of a licensing verdict, for the same reason the
      // entries in this file are not computed from a role.
      requires: ["VIEW_OPERATIONS"],
      children: [
        { title: "Overview", href: "/dashboard/compliance", icon: ShieldCheck },
        { title: "Sites", href: "/dashboard/compliance/facilities", icon: Factory },
      ],
    },
    {
      key: "regulators",
      title: "Regulators",
      icon: ShieldCheck,
      // Standing up an authority is the platform operator's act; reviewing the
      // licence queue is the authority's own work, which is a different
      // capability and a different person.
      requiresAny: ["ADMINISTER_PLATFORM", "MANAGE_RECALL"],
      children: [
        { title: "Manage Regulators", href: "/dashboard/regulators", icon: List, requires: ["ADMINISTER_PLATFORM"] },
        { title: "License Review", href: "/dashboard/regulator", icon: FileBadge, requires: ["MANAGE_RECALL"] },
      ],
    },
  ];

  // ── Operations & Records ──
  const operationsNavItems: NavEntry[] = [
    {
      // The working screen: scan an identity and act on it without leaving.
      title: "Trace & Act",
      href: "/dashboard/manufacturing/trace",
      icon: Clock,
      requires: ["VIEW_OPERATIONS"],
    },
    {
      title: t("reports"),
      href: "/dashboard/reports",
      icon: BarChart3,
      requires: ["VIEW_OPERATIONS"],
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
      requires: ["VIEW_OPERATIONS"],
    },
    {
      title: "Licenses & Permits",
      href: "/dashboard/licenses",
      icon: FileBadge,
      requires: ["VIEW_OPERATIONS"],
    },
    {
      title: t("auditLogs"),
      href: "/dashboard/audit",
      icon: ClipboardList,
      requires: ["ADMINISTER_PLATFORM"],
    },
    {
      title: t("maintenance"),
      href: "/dashboard/maintenance",
      icon: Wrench,
      requires: ["APPLY_LIFECYCLE"],
    },
    {
      // Reading the recall register needs VIEW_OPERATIONS. Issuing and
      // lifting need MANAGE_RECALL — gated on Trace actions and the detail
      // page, not by hiding this link (warehouse staff still need to see
      // which lots are recalled).
      title: "Recalls",
      href: "/dashboard/recall",
      icon: AlertTriangle,
      requires: ["VIEW_OPERATIONS"],
    },
  ];
  const utilityNavItems: NavEntry[] = [
    {
      title: t("settings"),
      href: "/dashboard/settings",
      icon: Settings,
      requires: ["MANAGE_USERS"],
    },
  ];

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
  const visibleOperations = operationsNavItems.filter(hasAccess);
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
        {/* Platform */}
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
                // Keep the section open while a nested child page is active
                // (e.g. Categories under Products) so the highlight stays visible.
                const isSubOpen = !!openSubmenus[item.key] || !!isChildActive;
                // Exact only: /dashboard must not light up for every /dashboard/... page.
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

        {/* Operations & Records */}
        {visibleOperations.length > 0 && (
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="px-2.5 text-[11px] font-bold text-white/65 uppercase tracking-wider">
              Operations & Records
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1 mt-1">
                {visibleOperations.map((item) => {
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

        {/* Settings */}
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
