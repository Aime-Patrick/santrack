import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { regulatoryAuthorityService, type RegulatoryAuthorityProfile } from "@/services/regulatory-authority.service";

export const regulatoryAuthorityKeys = { mine: ["regulatory-authority", "mine"] as const };
export const regulatoryAuthoritiesKey = ["regulatory-authorities"] as const;
export function useRegulatoryAuthorities() { return useQuery({ queryKey: regulatoryAuthoritiesKey, queryFn: regulatoryAuthorityService.list }); }

export function useMyRegulatoryAuthority(enabled: boolean) {
  return useQuery({ queryKey: regulatoryAuthorityKeys.mine, queryFn: regulatoryAuthorityService.mine, enabled });
}

export function useConfigureMyRegulatoryAuthority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Pick<RegulatoryAuthorityProfile, "mandates" | "caseCategories" | "teams" | "referralResponseDays">) => regulatoryAuthorityService.configureMine(input),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: regulatoryAuthorityKeys.mine }); toast.success("Authority settings saved"); },
  });
}

export function useOnboardRegulatoryAuthority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { code: string; operatingOrganizationId: number }) => regulatoryAuthorityService.create(input),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: regulatoryAuthoritiesKey }); toast.success("Authority workspace onboarded"); },
  });
}

export function useOnboardAuthorityFull() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      code: string;
      operatingOrganizationId?: number;
      adminFullName?: string;
      adminEmail?: string;
      adminPassword?: string;
    }) => regulatoryAuthorityService.onboard(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: regulatoryAuthoritiesKey });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success(`${data.organization.name} onboarded as ${data.authority.code}`);
    },
  });
}
