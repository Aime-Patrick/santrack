import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { organizationService, TRADE_TYPES } from "@/services/organization.service";
import type { OrganizationType } from "@/lib/api";
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

/** Approves or rejects a registration application. */
export function useDecideRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orgId,
      decision,
    }: {
      orgId: number;
      decision: { decision: "APPROVE" | "REJECT"; reason?: string };
    }) => onboardingService.decide(orgId, decision),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: registrationKeys.pending });
      qc.invalidateQueries({ queryKey: organizationKeys.all });
      toast.success(
        input.decision.decision === "APPROVE"
          ? "Registration approved — licence issued"
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

/** Certificate copies filed against a registration. */
export function useRegistrationDocuments(orgId: number) {
  return useQuery({
    queryKey: registrationKeys.documents(orgId),
    queryFn: () => onboardingService.documentsFor(orgId),
    enabled: orgId > 0,
  });
}
