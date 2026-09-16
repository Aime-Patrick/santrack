"use client";

import { useState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { TableFeatures } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useAuditLog } from "@/hooks/audit";
import { RecentActivitiesDialog } from "./recent-activities-dialog";
import { useTranslations } from "next-intl";

import { CheckCircle2, XCircle, Clock } from "lucide-react";

type Activity = {
  activity: string;
  module: string;
  user: string;
  date: string;
  status: "success" | "failed" | "pending";
  statusCode: number;
};

function deriveModule(path: string): string {
  const cleanPath = path.toLowerCase();
  if (cleanPath.includes("license") || cleanPath.includes("licensing")) return "Licensing";
  if (cleanPath.includes("product-registration") || cleanPath.includes("product_registration")) return "Product Registry";
  if (cleanPath.includes("product") || cleanPath.includes("item")) return "Products";
  if (cleanPath.includes("facility") || cleanPath.includes("premise") || cleanPath.includes("site")) return "Facilities";
  if (cleanPath.includes("production") || cleanPath.includes("batch")) return "Production";
  if (cleanPath.includes("transfer") || cleanPath.includes("shipment") || cleanPath.includes("dispatch")) return "Logistics";
  if (cleanPath.includes("inventory") || cleanPath.includes("stock")) return "Inventory";
  if (cleanPath.includes("organization") || cleanPath.includes("industry")) return "Organizations";
  if (cleanPath.includes("regulator") || cleanPath.includes("regulatory") || cleanPath.includes("authority")) return "Regulatory";
  if (cleanPath.includes("inspection")) return "Inspection";
  if (cleanPath.includes("recall")) return "Recall";
  if (cleanPath.includes("compliance") || cleanPath.includes("finding")) return "Compliance";
  if (cleanPath.includes("trace") || cleanPath.includes("scan") || cleanPath.includes("gs1")) return "Traceability";
  if (cleanPath.includes("invoice") || cleanPath.includes("sale") || cleanPath.includes("customer")) return "Commerce";
  if (cleanPath.includes("user") || cleanPath.includes("employee") || cleanPath.includes("role") || cleanPath.includes("permission")) return "Access Control";
  if (cleanPath.includes("auth") || cleanPath.includes("login") || cleanPath.includes("session")) return "Authentication";
  if (cleanPath.includes("audit") || cleanPath.includes("security")) return "Audit";
  return "System";
}

function deriveActivity(method: string, path: string): string {
  const cleanPath = path.toLowerCase();
  const m = method.toUpperCase();

  if (cleanPath.includes("/licenses/apply") || cleanPath.includes("/licenses/premise")) return "Applied for Premise License";
  if (cleanPath.includes("/licenses") && cleanPath.includes("/decision")) return "Decided License Application";
  if (cleanPath.includes("/licenses") && cleanPath.includes("/submit")) return "Submitted License Application";
  if (cleanPath.includes("/licenses") && cleanPath.includes("/documents")) return "Uploaded License Document";
  if (cleanPath.includes("/product-registrations") && cleanPath.includes("/decision")) return "Decided Product Registration";
  if (cleanPath.includes("/product-registrations") && m === "POST") return "Registered Product Application";
  if (cleanPath.includes("/production-orders") || cleanPath.includes("/productionorders")) {
    if (m === "POST") return "Created Production Batch";
    if (m === "PATCH" || m === "PUT") return "Updated Production Order";
  }
  if (cleanPath.includes("/organizations") && cleanPath.includes("/onboard")) return "Onboarded Organization";
  if (cleanPath.includes("/organizations") && cleanPath.includes("/approve")) return "Approved Organization Registration";
  if (cleanPath.includes("/auth/login")) return "User Signed In";
  if (cleanPath.includes("/auth/register")) return "Registered User Account";
  if (cleanPath.includes("/inspections") && m === "POST") return "Conducted Site Inspection";
  if (cleanPath.includes("/transfers") && m === "POST") return "Dispatched Stock Transfer";
  if (cleanPath.includes("/products") && m === "POST") return "Created Product SKU";
  if (cleanPath.includes("/facilities") && m === "POST") return "Registered Premise Site";
  if (cleanPath.includes("/scans") || cleanPath.includes("/trace")) return "Verified Traceability QR";

  const moduleName = deriveModule(path);
  const verbMap: Record<string, string> = {
    POST: "Created",
    PUT: "Updated",
    PATCH: "Modified",
    DELETE: "Removed",
    GET: "Viewed",
  };
  return `${verbMap[m] ?? m} ${moduleName}`;
}

function getActivityStatus(statusCode: number): "success" | "failed" | "pending" {
  if (statusCode === 202) return "pending";
  if (statusCode >= 200 && statusCode < 300) return "success";
  if (statusCode >= 400) return "failed";
  return "success";
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function RecentActivities() {
  const t = useTranslations("dashboard.activities");
  const tCommon = useTranslations("common");
  const { data: auditData, isLoading } = useAuditLog(10);
  const [showAll, setShowAll] = useState(false);

  const activities: Activity[] =
    auditData?.entries?.map((entry) => ({
      activity: deriveActivity(entry.method, entry.path),
      module: deriveModule(entry.path),
      user: entry.actor,
      date: formatDate(entry.performedAt),
      status: getActivityStatus(entry.statusCode),
      statusCode: entry.statusCode,
    })) ?? [];

  const columns: ColumnDef<TableFeatures, Activity>[] = useMemo(
    () => [
      {
        accessorKey: "activity",
        header: t("activity"),
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">{row.getValue("activity")}</span>
        ),
      },
      {
        accessorKey: "module",
        header: t("module"),
        cell: ({ row }) => (
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {row.getValue("module")}
          </span>
        ),
      },
      {
        accessorKey: "user",
        header: t("user"),
        cell: ({ row }) => (
          <span className="text-xs font-medium text-foreground">{row.getValue("user")}</span>
        ),
      },
      {
        accessorKey: "date",
        header: t("date"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">{row.getValue("date")}</span>
        ),
      },
      {
        accessorKey: "status",
        header: t("status"),
        cell: ({ row }) => {
          const status = row.original.status;
          const code = row.original.statusCode;
          if (status === "success") {
            return (
              <Badge variant="success" className="h-auto gap-1 px-2.5 py-0.5">
                <CheckCircle2 className="size-3" />
                {tCommon("success")}
              </Badge>
            );
          }
          if (status === "failed") {
            return (
              <Badge variant="danger" className="h-auto gap-1 px-2.5 py-0.5">
                <XCircle className="size-3" />
                {tCommon("failed")} {code >= 400 ? `(${code})` : ""}
              </Badge>
            );
          }
          return (
            <Badge variant="warning" className="h-auto gap-1 px-2.5 py-0.5">
              <Clock className="size-3" />
              {tCommon("pending")}
            </Badge>
          );
        },
      },
    ],
    [t, tCommon],
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("recentActivities")}</CardTitle>
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
          >
            {tCommon("viewAll")} →
          </button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="h-3 w-48 rounded bg-muted" />
                  <div className="h-3 w-20 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={activities}
              filterColumn="activity"
              filterPlaceholder={tCommon("search")}
              pageSize={5}
              showPagination={false}
              noBorder
            />
          )}
        </CardContent>
      </Card>

      <RecentActivitiesDialog open={showAll} onOpenChange={setShowAll} />
    </>
  );
}
