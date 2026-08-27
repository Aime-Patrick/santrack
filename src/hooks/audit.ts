import { useQuery } from "@tanstack/react-query";
import { auditService } from "@/services/audit.service";

export const auditKeys = {
  all: ["audit"] as const,
  list: (limit: number, organizationId?: number) =>
    [...auditKeys.all, "list", limit, organizationId ?? "all"] as const,
  detail: (id: number) => [...auditKeys.all, "detail", id] as const,
};

export function useAuditLog(limit = 100, organizationId?: number) {
  return useQuery({
    queryKey: auditKeys.list(limit, organizationId),
    queryFn: () => auditService.list(limit, organizationId),
  });
}

export function useAuditEntry(id: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: auditKeys.detail(id),
    queryFn: () => auditService.get(id),
    enabled: (options?.enabled ?? true) && id > 0,
  });
}
