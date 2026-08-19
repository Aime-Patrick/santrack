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
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/hooks/use-current-user";
import { can, type Capability, type UserRole } from "@/lib/api";
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
import { SanTrackLogoMark } from "@/components/auth/san-track-logo";

interface SubNavEntry {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavEntry {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  requires?: Capability[];
  children?: SubNavEntry[];
}

export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations("sidebar");
  const { data: me } = useCurrentUser();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const [openSubmenus, setOpenSubmenus] = React.useState<Record<string, boolean>>({
    industries: false,
    manufacturing: false,
    inventory: false,
    employees: false,
  });

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const role = me?.role as UserRole | undefined;

  const hasAccess = (requires?: Capability[]) => {
    if (!requires || requires.length === 0) return true;
    if (!role) return false;
    return requires.some((cap) => can(role, cap));
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
      requires: ["MANAGE_CATALOG", "ADMINISTER_PLATFORM"],
      children: [
        { title: "All Industries", href: "/dashboard/industries", icon: List },
        { title: "Add Industry", href: "/dashboard/industries/new", icon: PlusCircle },
      ],
    },
    {
      key: "manufacturing",
      title: "Manufacturing",
      icon: Factory,
      requires: ["MANAGE_CATALOG", "REGISTER_IDENTITY", "HANDLE_PACKAGING"],
      children: [
        { title: "Products", href: "/dashboard/products", icon: Package },
        { title: "Create Product", href: "/dashboard/products/new", icon: PlusCircle },
        { title: "Register Units", href: "/dashboard/manufacturing/register-units", icon: Hash },
        { title: "Register Package", href: "/dashboard/manufacturing/register-package", icon: PackagePlus },
        { title: "Pack Items", href: "/dashboard/manufacturing/pack", icon: PackageCheck },
        { title: "QR Generator", href: "/dashboard/manufacturing/qr-generator", icon: QrCode },
        { title: "QR Scanner", href: "/dashboard/manufacturing/scan", icon: ScanLine },
      ],
    },
    {
      key: "inventory",
      title: "Stock & Inventory",
      icon: Box,
      requires: ["VIEW_OPERATIONS", "MOVE_STOCK"],
      children: [
        { title: "Inventory Overview", href: "/dashboard/inventory", icon: List },
        { title: "Stock Transfer", href: "/dashboard/manufacturing/stock-transfer", icon: Truck },
        { title: "Stock Relocate", href: "/dashboard/manufacturing/stock-relocate", icon: ArrowRightLeft },
      ],
    },
    {
      key: "sales",
      title: t("salesOrders"),
      icon: ShoppingCart,
      requires: ["SELL"],
      children: [
        { title: "All Sales", href: "/dashboard/sales", icon: List },
        { title: "New Sale", href: "/dashboard/sales/new", icon: PlusCircle },
        { title: "Customers", href: "/dashboard/sales/customers", icon: Users },
        { title: "Invoices", href: "/dashboard/sales/invoices", icon: FileText },
        { title: "Returns", href: "/dashboard/sales/returns", icon: ArrowRightLeft },
      ],
    },
    {
      key: "employees",
      title: t("employees"),
      icon: Users,
      requires: ["MANAGE_USERS"],
      children: [
        { title: "All Employees", href: "/dashboard/employees", icon: List },
        { title: "Add Employee", href: "/dashboard/employees/new", icon: PlusCircle },
      ],
    },
  ];

  // ── Operations & Records ──
  const operationsNavItems: NavEntry[] = [
    {
      title: "Traceability",
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
      title: "Licenses & Permits",
      href: "/dashboard/licenses",
      icon: FileBadge,
      requires: ["VIEW_OPERATIONS"],
    },
    {
      title: "Regulator View",
      href: "/dashboard/regulator",
      icon: ShieldCheck,
      requires: ["ADMINISTER_PLATFORM"],
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
  ];

  // ── Settings ──
  const utilityNavItems: NavEntry[] = [
    {
      title: t("settings"),
      href: "/dashboard/settings",
      icon: Settings,
      requires: ["MANAGE_USERS"],
    },
  ];

  const visiblePlatform = platformNavItems.filter((i) => hasAccess(i.requires));
  const visibleOperations = operationsNavItems.filter((i) => hasAccess(i.requires));
  const visibleUtilities = utilityNavItems.filter((i) => hasAccess(i.requires));

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-none bg-rwanda-blue text-white">
      {/* ── Header ── */}
      <SidebarHeader className="p-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 py-1 rounded-lg transition-opacity hover:opacity-90 cursor-pointer"
        >
          <SanTrackLogoMark className="size-9.5 shrink-0 drop-shadow-md" />
          <div className="flex flex-col leading-none">
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
                const isSubOpen = !!openSubmenus[item.key];
                const isChildActive = item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
                const isDirectActive = item.href ? pathname === item.href : false;
                const isActive = isDirectActive || isChildActive;

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
                          const isCurrent = pathname === child.href;
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

      {/* ── System Status Card ── */}
      <div className="px-3 pb-3 group-data-[collapsible=icon]:hidden">
        <div className="rounded-xl bg-white/10 border border-white/15 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">System Status</span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#4ade80]">
              <span className="size-1.5 rounded-full bg-[#4ade80] animate-pulse" />
              Live
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded-lg bg-white/8 px-2 py-1.5 text-center">
              <p className="text-base font-extrabold text-white leading-none">24</p>
              <p className="text-[9px] text-white/70 mt-0.5 font-medium">Industries</p>
            </div>
            <div className="rounded-lg bg-white/8 px-2 py-1.5 text-center">
              <p className="text-base font-extrabold text-white leading-none">1,482</p>
              <p className="text-[9px] text-white/70 mt-0.5 font-medium">Items</p>
            </div>
          </div>
          <Link
            href="/dashboard/reports"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors py-1.5 text-[11px] font-semibold text-white"
          >
            View Full Report
          </Link>
        </div>
      </div>
    </Sidebar>
  );
}
