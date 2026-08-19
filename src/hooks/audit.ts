import { useQuery } from "@tanstack/react-query";
import { auditService } from "@/services/audit.service";

export function useAuditLog(limit = 100) {
  return useQuery({
    queryKey: ["audit", limit],
    queryFn: () => auditService.list(limit),
  });
}
