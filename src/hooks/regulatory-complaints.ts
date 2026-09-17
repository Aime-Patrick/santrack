import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { regulatoryComplaintService } from "@/services/regulatory-complaint.service";

export const regulatoryComplaintKeys = { all: ["regulatory-complaints"] as const };

export function useRegulatoryComplaints() {
  return useQuery({ queryKey: regulatoryComplaintKeys.all, queryFn: regulatoryComplaintService.list, staleTime: 15_000 });
}

export function usePromoteComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: regulatoryComplaintService.promote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regulatoryComplaintKeys.all });
      queryClient.invalidateQueries({ queryKey: ["regulatory-signals"] });
    },
  });
}

export function useDismissComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: regulatoryComplaintService.dismiss,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regulatoryComplaintKeys.all });
      queryClient.invalidateQueries({ queryKey: ["regulatory-signals"] });
    },
  });
}
