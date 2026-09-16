import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { licenseService } from "@/services/license.service";
import type {
  ApplyLicenseInput,
  LicenseDecision,
  CreateLicenseCategoryInput,
  UpdateLicenseCategoryInput,
  ActionFollowUpInput,
  CreateFollowUpInput,
  CloseFollowUpInput,
  SendFollowUpLinkInput,
} from "@/lib/api";

// Query key factory
export const licenseKeys = {
  all: ["licenses"] as const,
  my: () => [...licenseKeys.all, "mine"] as const,
  queue: () => [...licenseKeys.all, "queue"] as const,
  categories: () => [...licenseKeys.all, "categories"] as const,
  categoriesAll: () => [...licenseKeys.all, "categories", "all"] as const,
  documents: (id: number) => [...licenseKeys.all, id, "documents"] as const,
  regulatorDocuments: (id: number) =>
    [...licenseKeys.all, id, "documents", "regulator"] as const,
  history: (id: number) => [...licenseKeys.all, id, "history"] as const,
  followUps: (id: number) => [...licenseKeys.all, id, "followUps"] as const,
};

// ---------------------------------------------------------------------------
// Applicant-side hooks
// ---------------------------------------------------------------------------

/** Fetch active license categories for the apply form. */
export function useLicenseCategories() {
  return useQuery({
    queryKey: licenseKeys.categories(),
    queryFn: licenseService.categories,
    staleTime: 10 * 60_000,
  });
}

/** Fetch all license categories (including inactive) for administrative management. */
export function useAllLicenseCategories() {
  return useQuery({
    queryKey: licenseKeys.categoriesAll(),
    queryFn: licenseService.allCategories,
    staleTime: 30_000,
  });
}

/** Create a new license category (Admin only). */
export function useCreateLicenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLicenseCategoryInput) => licenseService.createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.categories() });
      queryClient.invalidateQueries({ queryKey: licenseKeys.categoriesAll() });
    },
  });
}

/** Update an existing license category (Admin only). */
export function useUpdateLicenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateLicenseCategoryInput }) =>
      licenseService.updateCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.categories() });
      queryClient.invalidateQueries({ queryKey: licenseKeys.categoriesAll() });
    },
  });
}

/** Delete or deactivate a license category (Admin only). */
export function useDeleteLicenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => licenseService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.categories() });
      queryClient.invalidateQueries({ queryKey: licenseKeys.categoriesAll() });
    },
  });
}

/** The current organization's licenses and applications. */
export function useMyLicenses(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: licenseKeys.my(),
    queryFn: licenseService.mine,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
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

/** Cancel a draft licence application. */
export function useCancelLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (licenseId: number) => licenseService.cancel(licenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.my() });
    },
  });
}

/** Renew an existing or expired licence. */
export function useRenewLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (licenseId: number) => licenseService.renew(licenseId),
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

/**
 * The same list, read as the regulator screening it.
 *
 * A separate hook rather than a flag on the one above, because it is a
 * different route with a different rule: `useLicenseDocuments` answers "my
 * paperwork" and refuses anything else, while this one answers "the paperwork
 * on the application in front of me" and is refused to anyone who is not a
 * licensing authority.
 */
export function useRegulatorDocuments(licenseId: number) {
  return useQuery({
    queryKey: licenseKeys.regulatorDocuments(licenseId),
    queryFn: () => licenseService.regulatorDocuments(licenseId),
    enabled: licenseId > 0,
  });
}

/** Saves a certificate to the visitor's machine. */
export function useDownloadDocument() {
  return useMutation({
    mutationFn: async ({
      documentId,
      filename,
    }: {
      documentId: number;
      filename: string;
    }) => {
      const blob = await licenseService.downloadDocument(documentId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    },
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

/**
 * Advisory compliance findings across businesses.
 * Licensing authorities and the platform operator (OVERSEE_INDUSTRIES).
 */
export function useComplianceFindings(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...licenseKeys.all, "findings"],
    queryFn: licenseService.findings,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useComplianceFinding(
  id: number,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...licenseKeys.all, "findings", id],
    queryFn: () => licenseService.finding(id),
    enabled: (options?.enabled ?? true) && id > 0,
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
// Follow-ups & Conditions hooks
// ---------------------------------------------------------------------------

/** Get follow-up items/conditions for a license (Applicant side). */
export function useLicenseFollowUps(licenseId: number) {
  return useQuery({
    queryKey: licenseKeys.followUps(licenseId),
    queryFn: () => licenseService.getFollowUps(licenseId),
    enabled: !!licenseId,
  });
}

/** Submit business response and evidence for a condition (Applicant side). */
export function useActionLicenseFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      licenseId,
      followUpId,
      input,
    }: {
      licenseId: number;
      followUpId: number;
      input: ActionFollowUpInput;
    }) => licenseService.actionFollowUp(licenseId, followUpId, input),
    onSuccess: (_, { licenseId }) => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.followUps(licenseId) });
      queryClient.invalidateQueries({ queryKey: licenseKeys.history(licenseId) });
      queryClient.invalidateQueries({ queryKey: licenseKeys.my() });
    },
  });
}

/** Get follow-up items/conditions for a license (Regulator side). */
export function useRegulatorLicenseFollowUps(licenseId: number) {
  return useQuery({
    queryKey: [...licenseKeys.followUps(licenseId), "regulator"],
    queryFn: () => licenseService.getRegulatorFollowUps(licenseId),
    enabled: !!licenseId,
  });
}

/** Attach a condition or follow-up requirement to a license (Regulator side). */
export function useCreateLicenseFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      licenseId,
      input,
    }: {
      licenseId: number;
      input: CreateFollowUpInput;
    }) => licenseService.createFollowUp(licenseId, input),
    onSuccess: (_, { licenseId }) => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.followUps(licenseId) });
      queryClient.invalidateQueries({ queryKey: [...licenseKeys.followUps(licenseId), "regulator"] });
      queryClient.invalidateQueries({ queryKey: licenseKeys.history(licenseId) });
      queryClient.invalidateQueries({ queryKey: licenseKeys.queue() });
    },
  });
}

/** Verify and close a follow-up condition (Regulator side). */
export function useCloseLicenseFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      licenseId,
      followUpId,
      input,
    }: {
      licenseId: number;
      followUpId: number;
      input: CloseFollowUpInput;
    }) => licenseService.closeFollowUp(licenseId, followUpId, input),
    onSuccess: (_, { licenseId }) => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.followUps(licenseId) });
      queryClient.invalidateQueries({ queryKey: [...licenseKeys.followUps(licenseId), "regulator"] });
      queryClient.invalidateQueries({ queryKey: licenseKeys.history(licenseId) });
      queryClient.invalidateQueries({ queryKey: licenseKeys.queue() });
    },
  });
}

/**
 * Sends an email to the licence holder with a one-time response link so they
 * can submit evidence against a condition without logging in (Regulator side).
 */
export function useSendFollowUpLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      licenseId,
      followUpId,
      input,
    }: {
      licenseId: number;
      followUpId: number;
      input: SendFollowUpLinkInput;
    }) => licenseService.sendFollowUpLink(licenseId, followUpId, input),
    onSuccess: (_, { licenseId }) => {
      queryClient.invalidateQueries({ queryKey: licenseKeys.followUps(licenseId) });
      queryClient.invalidateQueries({ queryKey: [...licenseKeys.followUps(licenseId), "regulator"] });
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
    CHANGES_REQUESTED: "Changes requested",
    REJECTED: "Rejected",
    ACTIVE: "Active",
    EXPIRED: "Expired",
    SUSPENDED: "Suspended",
    REVOKED: "Revoked",
    CANCELLED: "Cancelled",
  };
  return labels[status] ?? status;
}

/** Status → color token class for badges. */
export function statusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-success text-white border-success";
    case "SUBMITTED":
    case "UNDER_REVIEW":
      return "bg-info text-white border-info";
    case "CHANGES_REQUESTED":
      return "bg-[#d97706] text-white border-transparent";
    case "DRAFT":
      return "bg-muted text-muted-foreground border-border";
    case "EXPIRED":
      return "bg-[#d97706] text-white border-transparent";
    case "SUSPENDED":
    case "REJECTED":
      return "bg-danger text-white border-danger";
    case "REVOKED":
      return "bg-danger text-white border-danger";
    case "CANCELLED":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
