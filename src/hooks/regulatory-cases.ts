import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  regulatoryCaseService,
  type RegulatoryInspectionResult,
  type RegulatoryCaseStatus,
} from "@/services/regulatory-case.service";

export const regulatoryCaseKeys = {
  all: ["regulatory-cases"] as const,
  list: (status?: RegulatoryCaseStatus) => [...regulatoryCaseKeys.all, "list", status ?? "all"] as const,
  officers: () => [...regulatoryCaseKeys.all, "officers"] as const,
  detail: (id: number) => [...regulatoryCaseKeys.all, "detail", id] as const,
  inspections: (id: number) => [...regulatoryCaseKeys.all, "inspections", id] as const,
  roster: () => [...regulatoryCaseKeys.all, "inspections", "roster"] as const,
};

export function useRegulatoryCases(status?: RegulatoryCaseStatus) {
  return useQuery({
    queryKey: regulatoryCaseKeys.list(status),
    queryFn: () => regulatoryCaseService.list(status),
    staleTime: 15_000,
  });
}

export function useRegulatoryCase(id: number | null) {
  return useQuery({
    queryKey: regulatoryCaseKeys.detail(id ?? 0),
    queryFn: () => regulatoryCaseService.one(id as number),
    enabled: id !== null && id > 0,
  });
}

export function useRegulatoryOfficers() {
  return useQuery({
    queryKey: regulatoryCaseKeys.officers(),
    queryFn: regulatoryCaseService.officers,
    staleTime: 60_000,
  });
}

export function useChangeRegulatoryCaseStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: RegulatoryCaseStatus; note?: string }) =>
      regulatoryCaseService.changeStatus(id, status, note),
    onSuccess: (caseRecord) => {
      queryClient.invalidateQueries({ queryKey: regulatoryCaseKeys.all });
      queryClient.setQueryData(regulatoryCaseKeys.detail(caseRecord.id), (current: unknown) =>
        current ? { ...(current as object), ...caseRecord } : current,
      );
    },
  });
}

export function useOpenRegulatoryCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: regulatoryCaseService.open,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: regulatoryCaseKeys.all }),
  });
}

export function useRecordRegulatoryInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ caseId, result, notes }: { caseId: number; result: RegulatoryInspectionResult; notes?: string }) =>
      regulatoryCaseService.recordInspection(caseId, { result, notes }),
    onSuccess: (_inspection, input) => {
      queryClient.invalidateQueries({ queryKey: regulatoryCaseKeys.all });
      queryClient.invalidateQueries({ queryKey: regulatoryCaseKeys.detail(input.caseId) });
      queryClient.invalidateQueries({ queryKey: regulatoryCaseKeys.inspections(input.caseId) });
      queryClient.invalidateQueries({ queryKey: regulatoryCaseKeys.roster() });
    },
  });
}

export function useAssignRegulatoryCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, officerId, note }: { id: number; officerId: number; note?: string }) =>
      regulatoryCaseService.assign(id, officerId, note),
    onSuccess: (caseRecord) => {
      queryClient.invalidateQueries({ queryKey: regulatoryCaseKeys.all });
      queryClient.invalidateQueries({ queryKey: regulatoryCaseKeys.detail(caseRecord.id) });
    },
  });
}

export function useAssignRegulatoryCaseTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, team }: { id: number; team: string }) => regulatoryCaseService.assignTeam(id, team),
    onSuccess: (caseRecord) => {
      queryClient.invalidateQueries({ queryKey: regulatoryCaseKeys.all });
      queryClient.invalidateQueries({ queryKey: regulatoryCaseKeys.detail(caseRecord.id) });
    },
  });
}

export function useCaseInspections(caseId: number | null) {
  return useQuery({
    queryKey: regulatoryCaseKeys.inspections(caseId ?? 0),
    queryFn: () => regulatoryCaseService.listInspections(caseId as number),
    enabled: caseId !== null && caseId > 0,
  });
}

export function useAuthorityInspections(limit = 50) {
  return useQuery({
    queryKey: [...regulatoryCaseKeys.roster(), limit],
    queryFn: () => regulatoryCaseService.listAuthorityInspections(limit),
    staleTime: 15_000,
  });
}

// ── Business-facing: cases opened against my organisation ───────────────────

export const businessCaseKeys = {
  all: ["business-regulatory-cases"] as const,
  list: () => [...businessCaseKeys.all, "list"] as const,
  detail: (id: number) => [...businessCaseKeys.all, "detail", id] as const,
};

export function useMyRegulatoryCases() {
  return useQuery({
    queryKey: businessCaseKeys.list(),
    queryFn: () => regulatoryCaseService.myCases(),
    staleTime: 15_000,
  });
}

export function useMyRegulatoryCase(id: number | null) {
  return useQuery({
    queryKey: businessCaseKeys.detail(id ?? 0),
    queryFn: () => regulatoryCaseService.myCase(id as number),
    enabled: id !== null && id > 0,
  });
}

export function useSubmitCaseEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ caseId, file, note }: { caseId: number; file: File; note?: string }) =>
      regulatoryCaseService.submitEvidence(caseId, file, note),
    onSuccess: (_evidence, input) => {
      queryClient.invalidateQueries({ queryKey: businessCaseKeys.all });
      queryClient.invalidateQueries({ queryKey: businessCaseKeys.detail(input.caseId) });
    },
  });
}
