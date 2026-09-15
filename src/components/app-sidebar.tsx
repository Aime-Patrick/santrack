"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Settings } from "lucide-react";
import { useCapabilities } from "@/hooks/permissions";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  APP_NAVIGATION_GROUPS,
  type NavigationAccess,
  type NavigationEntry,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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

function pathMatchesHref(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

function activeChildHref(
  pathname: string,
  children: { href: string }[],
): string | null {
  const matches = children.filter((child) => pathMatchesHref(pathname, child.href));
  if (matches.length === 0) return null;
  return matches.reduce((best, child) =>
    child.href.length > best.href.length ? child : best,
  ).href;
}

export function AppSidebar() {
  const pathname = usePathname();
  const permissions = useCapabilities();
  const { data: me } = useCurrentUser();
  const hasOrganization = !!me?.organization;
  const isRegulator = me?.organization?.type === "REGULATOR";
  const isTradingOrg = hasOrganization && !isRegulator;
  const organizationType = me?.organization?.type;
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [openSubmenus, setOpenSubmenus] = React.useState<Record<string, boolean>>({});

  const hasAccess = (entry: NavigationAccess) => {
    if (permissions.loading) return false;
    if (entry.requiresOrganization && !hasOrganization) return false;
    if (entry.requiresTradingOrg && !isTradingOrg) return false;
    if (
      entry.organizationTypes &&
      (!organizationType || !entry.organizationTypes.includes(organizationType))
    ) {
      return false;
    }
    if (entry.requires && !permissions.canAll(entry.requires)) return false;
    if (entry.requiresAny && !permissions.canAny(entry.requiresAny)) return false;
    return true;
  };

  const resolvedGroups = React.useMemo(() => {
    let dashboardRendered = false;

    return APP_NAVIGATION_GROUPS
      .filter((group) => {
        if (group.requiresTradingOrg && !isTradingOrg) return false;
        if (group.requiresRegulator && !isRegulator) return false;
        return hasAccess(group);
      })
      .map((group) => {
        const items = group.items
          .filter(hasAccess)
          .filter((item) => {
            if (item.href !== "/dashboard") return true;
            if (dashboardRendered) return false;
            dashboardRendered = true;
            return true;
          })
          .map((item) => ({
            ...item,
            children: item.children?.filter(hasAccess),
          }))
          .filter((item) => !item.children || item.children.length > 0);

        return { ...group, items };
      })
      .filter((group) => group.items.length > 0);
    // Permission values are stable functions from useCapabilities; rerendering
    // on the user and capability update is what keeps navigation current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasOrganization, isRegulator, isTradingOrg, organizationType, permissions.capabilities, permissions.loading]);

  const showSettings = hasAccess({ requires: ["MANAGE_USERS"] });

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-none bg-rwanda-blue text-white"
    >
      <SidebarHeader className="flex items-center justify-center p-2 group-data-[collapsible=icon]:px-1.5">
        <Link
          href="/dashboard"
          className={cn(
            "flex w-full cursor-pointer items-center gap-2.5 rounded-lg py-1 transition-opacity hover:opacity-90",
            isCollapsed && "justify-center px-0",
          )}
          title="SANTRACK"
        >
          <img
            src="/images/logo-symbol.png"
            alt="SANTRACK"
            className={cn(
              "shrink-0 drop-shadow-md",
              isCollapsed ? "size-8" : "size-9.5",
            )}
          />
          <div className="flex min-w-0 flex-col leading-none group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-1 leading-none">
              <span className="text-base font-extrabold tracking-tight text-white">SAN</span>
              <span className="text-base font-extrabold tracking-tight text-rwanda-yellow">TRACK</span>
            </div>
            <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.15em] text-white/80">
              Industry Management
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent
        className={cn(
          "space-y-3 px-2 py-2",
          // Clear bottom chrome / browser overlays when icon-collapsed
          isCollapsed && "items-center px-1.5 pb-4",
        )}
      >
        {resolvedGroups.map((group) => (
          <SidebarGroup key={group.key} className="p-0">
            <SidebarGroupLabel className="px-2.5 text-[11px] font-bold uppercase tracking-wider text-white/65">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className={cn("mt-1 gap-1", isCollapsed && "items-center")}>
                {group.items.map((item) => (
                  <NavItem
                    key={item.key}
                    item={item}
                    pathname={pathname}
                    isCollapsed={isCollapsed}
                    isOpen={!!openSubmenus[item.key]}
                    onToggle={() =>
                      setOpenSubmenus((current) => ({
                        ...current,
                        [item.key]: !current[item.key],
                      }))
                    }
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {showSettings ? (
        <SidebarFooter className={cn("p-2", isCollapsed && "items-center px-1.5 pb-3")}>
          <SidebarMenu className={cn("gap-1", isCollapsed && "items-center")}>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/dashboard/settings")}
                tooltip="Settings"
                render={<Link href="/dashboard/settings" />}
                className={cn(
                  "h-9 rounded-lg px-2.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/12 hover:text-white",
                  pathname.startsWith("/dashboard/settings") &&
                    "bg-white/20 font-bold text-white shadow-xs",
                  isCollapsed && "justify-center",
                )}
              >
                <Settings className="size-4 shrink-0 text-white/80 group-hover/menu-button:text-white" />
                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      ) : null}
    </Sidebar>
  );
}

function NavItem({
  item,
  pathname,
  isCollapsed,
  isOpen,
  onToggle,
}: {
  item: NavigationEntry;
  pathname: string;
  isCollapsed: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = item.icon;
  const hasChildren = !!item.children?.length;
  const isChildActive = item.children?.some((child) => pathMatchesHref(pathname, child.href)) ?? false;
  const isSubOpen = isOpen || isChildActive;
  const isActive = (item.href ? pathname === item.href : false) || isChildActive;
  const activeChild = item.children ? activeChildHref(pathname, item.children) : null;

  if (!hasChildren && item.href) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive}
          tooltip={item.title}
          render={<Link href={item.href} />}
          className={cn(
            "h-9 rounded-lg px-2.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/12 hover:text-white",
            isActive && "bg-white/20 font-bold text-white shadow-xs",
            isCollapsed && "justify-center",
          )}
        >
          <Icon className="size-4 shrink-0 text-white/80 group-hover/menu-button:text-white" />
          <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
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
        render={item.href ? <Link href={item.href} /> : undefined}
        className={cn(
          "h-9 justify-between rounded-lg px-2.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/12 hover:text-white",
          isActive && "bg-white/10 font-semibold text-white",
          isCollapsed && "justify-center",
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Icon className="size-4 shrink-0 text-white/80 group-hover/menu-button:text-white" />
          <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
        </div>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-white/70 transition-transform duration-200 group-data-[collapsible=icon]:hidden",
            isSubOpen && "rotate-180",
          )}
        />
      </SidebarMenuButton>

      {isSubOpen && !isCollapsed && item.children && (
        <SidebarMenuSub className="mt-1 ml-5 space-y-0.5 border-l-2 border-white/25 pl-2">
          {item.children.map((child) => {
            const ChildIcon = child.icon;
            return (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton
                  isActive={child.href === activeChild}
                  render={<Link href={child.href} />}
                  className={cn(
                    "h-7.5 rounded-md px-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white",
                    child.href === activeChild && "bg-white/25 font-bold text-white",
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
