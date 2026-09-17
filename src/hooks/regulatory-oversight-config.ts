import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { regulatoryOversightConfigService } from "@/services/regulatory-oversight-config.service";
import type { RegulatoryOversightMode } from "@/services/regulatory-oversight.service";

const key = ["regulatory-oversight", "scopes"] as const;

export const useRegulatoryOversightScopes = () =>
  useQuery({ queryKey: key, queryFn: regulatoryOversightConfigService.list });

export function useGrantRegulatoryOversightScope() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      oversightOrganizationId,
      authorityId,
      mode,
    }: {
      oversightOrganizationId: number;
      authorityId: number;
      mode: RegulatoryOversightMode;
    }) =>
      regulatoryOversightConfigService.grant(
        oversightOrganizationId,
        authorityId,
        mode,
      ),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: key });
      toast.success(
        variables.mode === "SUPERVISE"
          ? "Supervise scope granted — overseer can follow up on that authority"
          : "Observe scope granted — aggregates only",
      );
    },
  });
}

export function useSetRegulatoryOversightMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      mode,
    }: {
      id: number;
      mode: RegulatoryOversightMode;
    }) => regulatoryOversightConfigService.setMode(id, mode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast.success("Oversight mode updated");
    },
  });
}

export function useRevokeRegulatoryOversightScope() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: regulatoryOversightConfigService.revoke,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast.success("Oversight scope removed");
    },
  });
}
