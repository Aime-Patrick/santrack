import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { regulatoryReferralService } from "@/services/regulatory-referral.service";
import { regulatoryCaseKeys } from "@/hooks/regulatory-cases";

export const regulatoryReferralKeys = { incoming: ["regulatory-referrals", "incoming"] as const };
export function useIncomingRegulatoryReferrals() { return useQuery({ queryKey: regulatoryReferralKeys.incoming, queryFn: regulatoryReferralService.incoming }); }
export function useReferRegulatoryCase() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ caseId, toAuthorityId, reason }: { caseId: number; toAuthorityId: number; reason: string }) => regulatoryReferralService.refer(caseId, toAuthorityId, reason), onSuccess: () => { queryClient.invalidateQueries({ queryKey: regulatoryCaseKeys.all }); toast.success("Referral sent for the receiving authority to review"); } });
}
function useDecision(action: "accept" | "reject") {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, note }: { id: number; note?: string }) => regulatoryReferralService[action](id, note), onSuccess: () => { queryClient.invalidateQueries({ queryKey: regulatoryReferralKeys.incoming }); queryClient.invalidateQueries({ queryKey: regulatoryCaseKeys.all }); toast.success(action === "accept" ? "Referral accepted; the case is now in your queue" : "Referral declined"); } });
}
export const useAcceptRegulatoryReferral = () => useDecision("accept");
export const useRejectRegulatoryReferral = () => useDecision("reject");
