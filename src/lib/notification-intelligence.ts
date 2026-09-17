export type InboxNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  module: string | null;
  actionUrl: string | null;
  read: boolean;
  createdAt: string;
};

export type InboxFilter = "all" | "action" | "updates";

const ACTION_TYPES = new Set(["WARNING", "ERROR", "DANGER"]);

export function notificationTone(
  type: string,
): "info" | "success" | "warning" | "error" {
  switch (type.toUpperCase()) {
    case "SUCCESS":
      return "success";
    case "WARNING":
      return "warning";
    case "ERROR":
    case "DANGER":
      return "error";
    default:
      return "info";
  }
}

export function needsAction(notification: InboxNotification): boolean {
  if (ACTION_TYPES.has(notification.type.toUpperCase())) return true;
  const url = notification.actionUrl ?? "";
  return (
    /tab=(registrations|licences|enforcement|intelligence)/.test(url) ||
    url.includes("/dashboard/regulator") ||
    url.includes("/onboarding") ||
    url.includes("/apply/respond") ||
    url.includes("/quality") ||
    url.includes("/compliance/cases") ||
    url.includes("/recall")
  );
}

export function actionLabel(url: string | null): string {
  if (!url) return "View details";
  const query = url.split("?")[1] ?? "";
  const path = url.split("?")[0];
  if (query.includes("tab=registrations")) return "Review application";
  if (query.includes("tab=licences")) return "Open licence queue";
  if (query.includes("tab=enforcement")) {
    return query.includes("case=") ? "Open case" : "Open casework";
  }
  if (query.includes("tab=intelligence")) return "Triage signal";
  if (path.includes("/licenses")) return "Open licences";
  if (path.includes("/compliance/cases")) return "Open cases";
  if (path.includes("/manufacturing/quality")) return "Open QC";
  if (path.includes("/stock-transfer")) return "Open transfers";
  if (path.includes("/inventory")) return "Review stock";
  if (path.includes("/recall")) return "Open recall";
  if (path.includes("/onboarding")) return "Continue onboarding";
  if (path.includes("/apply/respond")) return "Respond now";
  if (path.includes("/regulator")) return "Open regulator desk";
  if (path === "/dashboard") return "Open dashboard";
  return "Open";
}

export function moduleLabel(
  module: string | null,
  url: string | null,
): string {
  const key = (module ?? "").toLowerCase();
  const labels: Record<string, string> = {
    compliance: "Registration",
    licensing: "Licensing",
    regulator: "Enforcement",
    manufacturing: "Production",
    transfers: "Transfers",
    inventory: "Inventory",
    recall: "Recall",
  };
  if (labels[key]) return labels[key];
  if (url?.includes("registrations")) return "Registration";
  if (url?.includes("licences") || url?.includes("/licenses")) return "Licensing";
  if (url?.includes("enforcement") || url?.includes("case=")) return "Enforcement";
  if (url?.includes("intelligence")) return "Intelligence";
  if (url?.includes("/recall")) return "Recall";
  if (url?.includes("quality")) return "Quality";
  if (url?.includes("inventory")) return "Inventory";
  if (url?.includes("transfer")) return "Transfers";
  return "SANTRACK";
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diffMin = Math.max(0, Math.floor((Date.now() - then) / 60_000));
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function sortInbox(items: InboxNotification[]): InboxNotification[] {
  return [...items].sort((a, b) => {
    const aHot = Number(needsAction(a) && !a.read);
    const bHot = Number(needsAction(b) && !b.read);
    if (aHot !== bHot) return bHot - aHot;
    if (a.read !== b.read) return Number(a.read) - Number(b.read);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function matchesFilter(
  notification: InboxNotification,
  filter: InboxFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "action") return needsAction(notification);
  return !needsAction(notification);
}
