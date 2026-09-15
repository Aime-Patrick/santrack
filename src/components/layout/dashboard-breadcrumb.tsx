"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/**
 * Maps pathname segments to human-readable labels.
 * Falls back to title-casing the segment itself.
 */
const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  industries: "Industries",
  items: "Inventory",
  products: "Production",
  employees: "Employees",
  sales: "Sales & Orders",
  maintenance: "Maintenance",
  reports: "Reports",
  settings: "Settings",
  users: "Users & Roles",
  audit: "Audit Logs",
  licenses: "Licenses",
  regulator: "Regulator",
  recall: "Recalls",
  manufacturing: "Manufacturing",
  inventory: "Inventory",
  batches: "Batches",
  "register-units": "Register Units",
  "register-package": "Register Package",
  pack: "Pack Items",
  "qr-generator": "QR Generator",
  scan: "QR Scanner",
  "stock-transfer": "Stock Transfer",
  "stock-relocate": "Stock Relocate",
  trace: "Traceability",
  resources: "Resources",
  quality: "Quality Control",
  production: "Production",
  logistics: "Logistics",
  finance: "Finance",
  categories: "Categories",
  brands: "Brands",
  new: "Add New",
  compliance: "Compliance",
  facilities: "Sites",
  "start-production": "Start Production",
};

/**
 * Sidebar sections that are menus, not pages. Building hrefs from the path
 * alone would link "Manufacturing" to /dashboard/manufacturing, which 404s.
 * Send those crumbs to the section's real landing page instead.
 */
const SECTION_LANDINGS: Record<string, string> = {
  logistics: "/dashboard/logistics/shipments",
  finance: "/dashboard/finance/accounts",
};

function labelFromSegment(segment: string): string {
  return PAGE_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

function hrefForSegments(segments: string[], endIndex: number): string {
  const built = "/dashboard/" + segments.slice(0, endIndex + 1).join("/");
  const last = segments[endIndex];
  // Only rewrite when this crumb is the bare section (no deeper path yet).
  if (endIndex === 0 && last && SECTION_LANDINGS[last]) {
    return SECTION_LANDINGS[last];
  }
  return built;
}

export function DashboardBreadcrumb() {
  const pathname = usePathname();

  // Strip the /dashboard prefix and split into segments
  const relative = pathname.replace(/^\/dashboard\/?/, "");
  const segments = relative ? relative.split("/").filter(Boolean) : [];

  // Build breadcrumb items: always starts with "Dashboard"
  const items: { label: string; href?: string }[] = [
    { label: "Dashboard", href: "/dashboard" },
  ];

  if (segments.length === 0) {
    // We're on /dashboard — just show "Dashboard" as the current page
    items[0].href = undefined;
  } else {
    // Add intermediate segments as links, last one as current page
    segments.forEach((seg, i) => {
      const isLast = i === segments.length - 1;
      items.push({
        label: labelFromSegment(seg),
        href: isLast ? undefined : hrefForSegments(segments, i),
      });
    });
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* SANTRACK — always a link */}
        <BreadcrumbItem>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            SANTRACK
          </Link>
        </BreadcrumbItem>

        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <React.Fragment key={item.label}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage className="text-xs font-semibold text-foreground">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <Link
                    href={item.href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
