import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { regulatoryOversightConfigService } from "@/services/regulatory-oversight-config.service";
const key = ["regulatory-oversight", "scopes"] as const;
export const useRegulatoryOversightScopes = () => useQuery({ queryKey: key, queryFn: regulatoryOversightConfigService.list });
export function useGrantRegulatoryOversightScope() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ oversightOrganizationId, authorityId }: { oversightOrganizationId: number; authorityId: number }) => regulatoryOversightConfigService.grant(oversightOrganizationId, authorityId), onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success("Read-only oversight scope granted"); } }); }
export function useRevokeRegulatoryOversightScope() { const qc = useQueryClient(); return useMutation({ mutationFn: regulatoryOversightConfigService.revoke, onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success("Oversight scope removed"); } }); }
