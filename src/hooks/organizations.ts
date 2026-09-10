import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { organizationService, TRADE_TYPES } from "@/services/organization.service";
import type { CreateInfoRequestInput, OrganizationType } from "@/lib/api";
import { onboardingService } from "@/services/onboarding.service";

export const organizationKeys = {
  all: ["organizations"] as const,
  list: (types?: OrganizationType[]) =>
    [...organizationKeys.all, "list", types?.join(",") ?? "all"] as const,
  regulators: [...["organizations"], "regulators"] as const,
  registry: [...["organizations"], "registry"] as const,
};

/** Every organization, oversight bodies included. For pickers that need them all. */
export function useOrganizations(types?: OrganizationType[]) {
  return useQuery({
    queryKey: organizationKeys.list(types),
    queryFn: () => organizationService.list(types),
  });
}

/**
 * The businesses only — a regulator is an authority, not an industry.
 *
 * This is the trading-partner directory: names and types, for the transfer and
 * sale pickers. For the supervisory Industries screen use `useIndustryRegistry`
 * instead, which is a different endpoint behind a different permission.
 */
export function useIndustries() {
  return useOrganizations(TRADE_TYPES);
}

/**
 * The industry register, "with staff", catalogue size and licence standing.
 *
 * Needs OVERSEE_INDUSTRIES — the licensing authorities and the platform
 * operator. The route guard keeps everyone else off the page, and the API
 * refuses the call regardless.
 */
export function useIndustryRegistry(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: organizationKeys.registry,
    queryFn: () => organizationService.registry(),
    enabled: options?.enabled ?? true,
  });
}

/** Corrects a registry entry — a renamed company, a mis-declared type. */
export function useAmendIndustry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: number;
      name?: string;
      type?: OrganizationType;
    }) => organizationService.amend(id, input),
    onSuccess: (organization) => {
      qc.invalidateQueries({ queryKey: organizationKeys.all });
      toast.success(`${organization.name} updated`);
    },
    onError: (error: unknown) => {
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not update this industry",
      );
    },
  });
}

export function useRegulators() {
  return useQuery({
    queryKey: organizationKeys.regulators,
    queryFn: () => organizationService.listRegulators(),
  });
}

function useStandingMutation<TInput>(
  mutationFn: (input: TInput) => Promise<unknown>,
  success: (input: TInput) => string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: organizationKeys.all });
      toast.success(success(input));
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not update regulatory standing";
      toast.error(message);
    },
  });
}

export function useRegisterRegulator() {
  return useStandingMutation(
    (name: string) => organizationService.registerRegulator(name),
    (name) => `${name} registered as a regulator`,
  );
}

export function useGrantStanding() {
  return useStandingMutation(
    ({ id }: { id: number; name: string }) => organizationService.grantStanding(id),
    ({ name }) => `${name} now holds regulatory standing`,
  );
}

export function useRevokeStanding() {
  return useStandingMutation(
    ({ id, revertTo, reason }: {
      id: number;
      name: string;
      revertTo: OrganizationType;
      reason: string;
    }) => organizationService.revokeStanding(id, { revertTo, reason }),
    ({ name, revertTo }) => `${name} is no longer a regulator — now a ${revertTo.toLowerCase()}`,
  );
}

/** Permanently removes an organization. SYSTEM_ADMIN / ADMINISTER_PLATFORM only. */
export function usePurgeOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; name: string }) =>
      organizationService.purge(id),
    onSuccess: (_data, { name }) => {
      qc.invalidateQueries({ queryKey: organizationKeys.all });
      toast.success(`${name} has been permanently deleted`);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not delete this organization";
      toast.error(message);
    },
  });
}

// ---------------------------------------------------------------------------
// Registration review ("Digital Tax Stamp flow"): pending registrations and the
// regulator's approve/reject decision.
// ---------------------------------------------------------------------------

export const registrationKeys = {
  pending: ["registrations", "pending"] as const,
  documents: (orgId: number) => ["registrations", "documents", orgId] as const,
};

/** Self-registered businesses awaiting the regulator's decision. */
export function usePendingRegistrations() {
  return useQuery({
    queryKey: registrationKeys.pending,
    queryFn: () => onboardingService.pending(),
  });
}

/** Approves, requests changes on, or rejects a registration application. */
export function useDecideRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orgId,
      decision,
    }: {
      orgId: number;
      decision: { decision: "APPROVE" | "REQUEST_CHANGES" | "REJECT"; reason?: string };
    }) => onboardingService.decide(orgId, decision),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: registrationKeys.pending });
      qc.invalidateQueries({ queryKey: organizationKeys.all });
      toast.success(
        input.decision.decision === "APPROVE"
          ? "Registration approved — licence issued"
          : input.decision.decision === "REQUEST_CHANGES"
          ? "Changes requested — applicant notified"
          : "Registration rejected",
      );
    },
    onError: (error: unknown) => {
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not decide this registration",
      );
    },
  });
}

/** Resubmit a CHANGES_REQUESTED registration back into the review queue. */
export function useResubmitRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orgId: number) => onboardingService.resubmit(orgId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationKeys.pending });
      qc.invalidateQueries({ queryKey: organizationKeys.all });
      toast.success("Registration resubmitted — a regulator will review it shortly");
    },
    onError: (error: unknown) => {
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not resubmit registration",
      );
    },
  });
}

/** Certificate copies filed against a registration. */
export function useRegistrationDocuments(orgId: number) {
  return useQuery({
    queryKey: registrationKeys.documents(orgId),
    queryFn: () => onboardingService.documentsFor(orgId),
    enabled: orgId > 0,
  });
}

// ---------------------------------------------------------------------------
// Inter-authority consultation hooks
// ---------------------------------------------------------------------------

export const consultationKeys = {
  forOrg: (orgId: number) => ["consultations", "org", orgId] as const,
  incoming: ["consultations", "incoming"] as const,
};

/** All consultations opened by the caller's authority on one application. */
export function useConsultations(orgId: number) {
  return useQuery({
    queryKey: consultationKeys.forOrg(orgId),
    queryFn: () => onboardingService.consultationsFor(orgId),
    enabled: orgId > 0,
  });
}

/** Open a consultation to another authority. */
export function useOpenConsultation(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof onboardingService.openConsultation>[1]) =>
      onboardingService.openConsultation(orgId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultationKeys.forOrg(orgId) });
      qc.invalidateQueries({ queryKey: registrationKeys.pending });
      toast.success("Consultation sent");
    },
    onError: (error: unknown) => {
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not send consultation",
      );
    },
  });
}

/** Primary authority cancels a pending consultation. */
export function useCancelConsultation(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (consultationId: number) =>
      onboardingService.cancelConsultation(orgId, consultationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultationKeys.forOrg(orgId) });
      qc.invalidateQueries({ queryKey: registrationKeys.pending });
      toast.success("Consultation cancelled");
    },
    onError: (error: unknown) => {
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not cancel consultation",
      );
    },
  });
}

/** Secondary authority inbox — incoming consultations. */
export function useIncomingConsultations() {
  return useQuery({
    queryKey: consultationKeys.incoming,
    queryFn: () => onboardingService.incomingConsultations(),
  });
}

/** Secondary authority responds to a consultation. */
export function useRespondConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      consultationId,
      input,
    }: {
      consultationId: number;
      input: Parameters<typeof onboardingService.respondConsultation>[1];
    }) => onboardingService.respondConsultation(consultationId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultationKeys.incoming });
      toast.success("Response submitted");
    },
    onError: (error: unknown) => {
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not submit response",
      );
    },
  });
}

// ---------------------------------------------------------------------------
// Registration information-request hooks
// ---------------------------------------------------------------------------

export const infoRequestKeys = {
  forOrg: (orgId: number) => ["info-requests", "org", orgId] as const,
};

/** Lists all information requests filed against a registration. Regulator only. */
export function useInfoRequests(orgId: number) {
  return useQuery({
    queryKey: infoRequestKeys.forOrg(orgId),
    queryFn: () => organizationService.listInfoRequests(orgId),
    enabled: orgId > 0,
  });
}

/** Creates an information request for a pending registration. Regulator only. */
export function useCreateInfoRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orgId,
      input,
    }: {
      orgId: number;
      input: CreateInfoRequestInput;
    }) => organizationService.createInfoRequest(orgId, input),
    onSuccess: (_data, { orgId }) => {
      qc.invalidateQueries({ queryKey: infoRequestKeys.forOrg(orgId) });
      toast.success("Information request sent — applicant notified by email");
    },
    onError: (error: unknown) => {
      toast.error(
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not send information request",
      );
    },
  });
}
