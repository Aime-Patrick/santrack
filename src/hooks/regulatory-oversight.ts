import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api";
import {
  regulatoryOversightService,
  type OversightLicenceOverrideAction,
} from "@/services/regulatory-oversight.service";

const oversightKey = ["regulatory-oversight"] as const;

export function useRegulatoryOversightSummary(enabled: boolean) {
  return useQuery({
    queryKey: [...oversightKey, "summary"],
    queryFn: regulatoryOversightService.summary,
    enabled,
    retry: false,
  });
}

export function useSupervisedOversightCases(enabled: boolean, authorityId?: number) {
  return useQuery({
    queryKey: [...oversightKey, "supervised-cases", authorityId ?? "all"],
    queryFn: () => regulatoryOversightService.supervisedCases(authorityId),
    enabled,
    retry: false,
  });
}

export function useSupervisedOversightLicences(enabled: boolean) {
  return useQuery({
    queryKey: [...oversightKey, "supervised-licences"],
    queryFn: regulatoryOversightService.supervisedLicences,
    enabled,
    retry: false,
  });
}

export function useSupervisedPendingLicences(enabled: boolean) {
  return useQuery({
    queryKey: [...oversightKey, "supervised-pending-licences"],
    queryFn: regulatoryOversightService.supervisedPendingLicences,
    enabled,
    retry: false,
  });
}

export function useNudgeSupervisedAuthority() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      authorityId,
      note,
    }: {
      authorityId: number;
      note?: string;
    }) => regulatoryOversightService.nudgeAuthority(authorityId, note),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: oversightKey });
      toast.success(
        result.notified > 0
          ? `Follow-up sent to ${result.notified} officer${result.notified === 1 ? "" : "s"}`
          : "No authority admins to notify",
      );
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not send follow-up")),
  });
}

export function useActivateSupervisedAuthority() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (authorityId: number) =>
      regulatoryOversightService.activateAuthority(authorityId),
    onSuccess: (authority) => {
      qc.invalidateQueries({ queryKey: oversightKey });
      toast.success(`${authority.name} is now active`);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not activate authority")),
  });
}

export function usePullUpSupervisedCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ caseId, reason }: { caseId: number; reason: string }) =>
      regulatoryOversightService.pullUpCase(caseId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: oversightKey });
      toast.success("Case pulled onto your desk");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not pull up case")),
  });
}

export function useOverrideSupervisedLicence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      licenseId,
      action,
      reason,
    }: {
      licenseId: number;
      action: OversightLicenceOverrideAction;
      reason: string;
    }) => regulatoryOversightService.overrideLicence(licenseId, action, reason),
    onSuccess: (license) => {
      qc.invalidateQueries({ queryKey: oversightKey });
      toast.success(`${license.licenseNumber} is now ${license.status}`);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not override licence")),
  });
}
