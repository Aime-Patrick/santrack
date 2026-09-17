import { api } from "@/lib/api";

export type RegulatoryAuthorityProfile = {
  id: number;
  code: string;
  name: string;
  mandates: string[];
  caseCategories: string[];
  teams: string[];
  referralResponseDays: number | null;
  isActive: boolean;
  operatingOrganization?: { id: number; name: string } | null;
};

export type RegulatoryTeamMember = {
  userId: number;
  fullName: string | null;
  email: string;
  isLeader: boolean;
};

export type RegulatoryTeam = {
  id: number;
  name: string;
  active: boolean;
  maxOpenCases: number | null;
  members: RegulatoryTeamMember[];
  leaderUserId: number | null;
};

export const regulatoryAuthorityService = {
  list: () =>
    api.get<RegulatoryAuthorityProfile[]>("/api/regulatory-authorities").then((r) => r.data),
  create: (input: { code: string; operatingOrganizationId: number }) =>
    api.post<RegulatoryAuthorityProfile>("/api/regulatory-authorities", input).then((r) => r.data),
  onboard: (input: {
    name: string;
    code: string;
    operatingOrganizationId?: number;
    adminFullName?: string;
    adminEmail?: string;
    adminPassword?: string;
  }) =>
    api
      .post<{
        authority: RegulatoryAuthorityProfile;
        organization: { id: number; name: string };
        adminUser: {
          id: number;
          email: string;
          fullName?: string;
          role: string;
          alreadyExisted?: boolean;
        };
      }>("/api/regulatory-authorities/onboard", input)
      .then((r) => r.data),
  mine: () =>
    api
      .get<RegulatoryAuthorityProfile>("/api/regulatory-authorities/me/profile")
      .then((r) => r.data),
  configureMine: (
    input: Partial<
      Pick<
        RegulatoryAuthorityProfile,
        "mandates" | "caseCategories" | "teams" | "referralResponseDays"
      >
    >,
  ) =>
    api
      .patch<RegulatoryAuthorityProfile>("/api/regulatory-authorities/me/profile", input)
      .then((r) => r.data),

  listTeams: (includeInactive = false) =>
    api
      .get<RegulatoryTeam[]>("/api/regulatory-authorities/me/teams", {
        params: includeInactive ? { includeInactive: true } : undefined,
      })
      .then((r) => r.data),

  listActiveTeams: () =>
    api
      .get<RegulatoryTeam[]>("/api/regulatory-authorities/me/teams/active")
      .then((r) => r.data),

  createTeam: (input: { name: string; maxOpenCases?: number | null }) =>
    api
      .post<RegulatoryTeam>("/api/regulatory-authorities/me/teams", input)
      .then((r) => r.data),

  updateTeam: (
    teamId: number,
    input: { name?: string; active?: boolean; maxOpenCases?: number | null },
  ) =>
    api
      .patch<RegulatoryTeam>(`/api/regulatory-authorities/me/teams/${teamId}`, input)
      .then((r) => r.data),

  addTeamMember: (teamId: number, input: { userId: number; isLeader?: boolean }) =>
    api
      .post<RegulatoryTeam>(
        `/api/regulatory-authorities/me/teams/${teamId}/members`,
        input,
      )
      .then((r) => r.data),

  updateTeamMember: (teamId: number, userId: number, input: { isLeader: boolean }) =>
    api
      .patch<RegulatoryTeam>(
        `/api/regulatory-authorities/me/teams/${teamId}/members/${userId}`,
        input,
      )
      .then((r) => r.data),

  removeTeamMember: (teamId: number, userId: number) =>
    api
      .delete<RegulatoryTeam>(
        `/api/regulatory-authorities/me/teams/${teamId}/members/${userId}`,
      )
      .then((r) => r.data),
};
