import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  regulatoryAuthorityService,
  type RegulatoryAuthorityProfile,
} from "@/services/regulatory-authority.service";

export const regulatoryAuthorityKeys = {
  mine: ["regulatory-authority", "mine"] as const,
  teams: ["regulatory-authority", "teams"] as const,
  activeTeams: ["regulatory-authority", "teams", "active"] as const,
};
export const regulatoryAuthoritiesKey = ["regulatory-authorities"] as const;

export function useRegulatoryAuthorities() {
  return useQuery({
    queryKey: regulatoryAuthoritiesKey,
    queryFn: regulatoryAuthorityService.list,
  });
}

export function useMyRegulatoryAuthority(enabled: boolean) {
  return useQuery({
    queryKey: regulatoryAuthorityKeys.mine,
    queryFn: regulatoryAuthorityService.mine,
    enabled,
    retry: false,
    throwOnError: false,
  });
}

export function useConfigureMyRegulatoryAuthority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Partial<
        Pick<
          RegulatoryAuthorityProfile,
          "mandates" | "caseCategories" | "teams" | "referralResponseDays"
        >
      >,
    ) => regulatoryAuthorityService.configureMine(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regulatoryAuthorityKeys.mine });
      queryClient.invalidateQueries({ queryKey: regulatoryAuthorityKeys.teams });
      queryClient.invalidateQueries({ queryKey: regulatoryAuthorityKeys.activeTeams });
    },
  });
}

export function useAuthorityTeams(enabled = true, includeInactive = true) {
  return useQuery({
    queryKey: [...regulatoryAuthorityKeys.teams, includeInactive] as const,
    queryFn: () => regulatoryAuthorityService.listTeams(includeInactive),
    enabled,
  });
}

export function useActiveAuthorityTeams(enabled = true) {
  return useQuery({
    queryKey: regulatoryAuthorityKeys.activeTeams,
    queryFn: regulatoryAuthorityService.listActiveTeams,
    enabled,
  });
}

function useInvalidateTeams() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: regulatoryAuthorityKeys.teams });
    queryClient.invalidateQueries({ queryKey: regulatoryAuthorityKeys.activeTeams });
    queryClient.invalidateQueries({ queryKey: regulatoryAuthorityKeys.mine });
  };
}

export function useCreateAuthorityTeam() {
  const invalidate = useInvalidateTeams();
  return useMutation({
    mutationFn: (input: { name: string; maxOpenCases?: number | null }) =>
      regulatoryAuthorityService.createTeam(input),
    onSuccess: () => {
      invalidate();
      toast.success("Team created");
    },
  });
}

export function useUpdateAuthorityTeam() {
  const invalidate = useInvalidateTeams();
  return useMutation({
    mutationFn: ({
      teamId,
      ...input
    }: {
      teamId: number;
      name?: string;
      active?: boolean;
      maxOpenCases?: number | null;
    }) => regulatoryAuthorityService.updateTeam(teamId, input),
    onSuccess: () => {
      invalidate();
      toast.success("Team updated");
    },
  });
}

export function useAddAuthorityTeamMember() {
  const invalidate = useInvalidateTeams();
  return useMutation({
    mutationFn: ({
      teamId,
      userId,
      isLeader,
    }: {
      teamId: number;
      userId: number;
      isLeader?: boolean;
    }) => regulatoryAuthorityService.addTeamMember(teamId, { userId, isLeader }),
    onSuccess: () => {
      invalidate();
      toast.success("Member added");
    },
  });
}

export function useUpdateAuthorityTeamMember() {
  const invalidate = useInvalidateTeams();
  return useMutation({
    mutationFn: ({
      teamId,
      userId,
      isLeader,
    }: {
      teamId: number;
      userId: number;
      isLeader: boolean;
    }) =>
      regulatoryAuthorityService.updateTeamMember(teamId, userId, { isLeader }),
    onSuccess: () => {
      invalidate();
      toast.success("Team leadership updated");
    },
  });
}

export function useRemoveAuthorityTeamMember() {
  const invalidate = useInvalidateTeams();
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) =>
      regulatoryAuthorityService.removeTeamMember(teamId, userId),
    onSuccess: () => {
      invalidate();
      toast.success("Member removed");
    },
  });
}

export function useOnboardRegulatoryAuthority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { code: string; operatingOrganizationId: number }) =>
      regulatoryAuthorityService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regulatoryAuthoritiesKey });
      toast.success("Authority workspace onboarded");
    },
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
