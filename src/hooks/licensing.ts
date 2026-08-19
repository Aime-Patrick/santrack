import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { licenseService } from "@/services/license.service";
import type { ApplyLicenseInput, LicenseDecision } from "@/lib/api";

// Query key factory
export const licenseKeys = {
  all: ["licenses"] as const,
  my: () => [...licenseKeys.all, "mine"] as const,
  queue: () => [...licenseKeys.all, "queue"] as const,
  categories: () => [...licenseKeys.all, "categories"] as const,
  documents: (id: number) => [...licenseKeys.all, id, "documents"] as const,
  history: (id: number) => [...licenseKeys.all, id, "history"] as const,
};

// ---------------------------------------------------------------------------
// Applicant-side hooks
// ---------------------------------------------------------------------------

/** Fetch license categories for the apply form. */
export function useLicenseCategories() {
  return useQuery({
    queryKey: licenseKeys.categories(),
    queryFn: licenseService.categories,
    staleTime: 10 * 60_000,
  });
}

/** The current organization's licenses and applications. */
export function useMyLicenses() {
  return useQuery({
    queryKey: licenseKeys.my(),
    queryFn: licenseService.mine,
    staleTime: 30_000,
  });
}

/** Start a new license application. */
export function useApplyLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ApplyLicenseInput) => licenseService.apply(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.my() });
    },
  });
}

/** Upload a document to a draft license. */
export function useAttachDocument(licenseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentType, file }: { documentType: string; file: File }) =>
      licenseService.attachDocument(licenseId, documentType, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.documents(licenseId) });
    },
  });
}

/** Submit a draft license for regulator review. */
export function useSubmitLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (licenseId: number) => licenseService.submit(licenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.my() });
    },
  });
}

/** Documents attached to a specific license. */
export function useLicenseDocuments(licenseId: number) {
  return useQuery({
    queryKey: licenseKeys.documents(licenseId),
    queryFn: () => licenseService.documents(licenseId),
    enabled: licenseId > 0,
  });
}

/** Audit trail for a specific license. */
export function useLicenseHistory(licenseId: number) {
  return useQuery({
    queryKey: licenseKeys.history(licenseId),
    queryFn: () => licenseService.history(licenseId),
    enabled: licenseId > 0,
  });
}

// ---------------------------------------------------------------------------
// Regulator-side hooks
// ---------------------------------------------------------------------------

/** Queue of submitted applications awaiting review. */
export function useRegulatorQueue() {
  return useQuery({
    queryKey: licenseKeys.queue(),
    queryFn: licenseService.queue,
    staleTime: 15_000,
  });
}

/** Mark an application as under review. */
export function useReviewLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (licenseId: number) => licenseService.review(licenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.queue() });
      queryClient.invalidateQueries({ queryKey: licenseKeys.my() });
    },
  });
}

/** Approve or reject a license. */
export function useDecideOnLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ licenseId, decision }: { licenseId: number; decision: LicenseDecision }) =>
      licenseService.decide(licenseId, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.queue() });
      queryClient.invalidateQueries({ queryKey: licenseKeys.my() });
    },
  });
}

/** Suspend an active license. */
export function useSuspendLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ licenseId, reason }: { licenseId: number; reason: string }) =>
      licenseService.suspend(licenseId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.queue() });
      queryClient.invalidateQueries({ queryKey: licenseKeys.my() });
    },
  });
}

/** Revoke a license (terminal). */
export function useRevokeLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ licenseId, reason }: { licenseId: number; reason: string }) =>
      licenseService.revoke(licenseId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.queue() });
      queryClient.invalidateQueries({ queryKey: licenseKeys.my() });
    },
  });
}

/** Reinstate a suspended license. */
export function useReinstateLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (licenseId: number) => licenseService.reinstate(licenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.queue() });
      queryClient.invalidateQueries({ queryKey: licenseKeys.my() });
    },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Whether a license status permits supply-chain operations. */
export function permitsOperation(status: string): boolean {
  return status === "ACTIVE";
}

/** Human-readable status label. */
export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    UNDER_REVIEW: "Under Review",
    REJECTED: "Rejected",
    ACTIVE: "Active",
    EXPIRED: "Expired",
    SUSPENDED: "Suspended",
    REVOKED: "Revoked",
  };
  return labels[status] ?? status;
}

/** Status → color token class for badges. */
export function statusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-success/10 text-success border-success/20";
    case "SUBMITTED":
    case "UNDER_REVIEW":
      return "bg-info/10 text-info border-info/20";
    case "DRAFT":
      return "bg-muted text-muted-foreground border-border";
    case "EXPIRED":
      return "bg-warning/10 text-warning-foreground border-warning/20";
    case "SUSPENDED":
    case "REJECTED":
      return "bg-danger/10 text-danger border-danger/20";
    case "REVOKED":
      return "bg-danger/15 text-danger border-danger/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
