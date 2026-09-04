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

export const regulatoryAuthorityService = {
  list: () => api.get<RegulatoryAuthorityProfile[]>("/api/regulatory-authorities").then((r) => r.data),
  create: (input: { code: string; operatingOrganizationId: number }) => api.post<RegulatoryAuthorityProfile>("/api/regulatory-authorities", input).then((r) => r.data),
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
        adminUser: { id: number; email: string; fullName?: string; role: string; alreadyExisted?: boolean };
      }>("/api/regulatory-authorities/onboard", input)
      .then((r) => r.data),
  mine: () => api.get<RegulatoryAuthorityProfile>("/api/regulatory-authorities/me/profile").then((r) => r.data),
  configureMine: (input: Pick<RegulatoryAuthorityProfile, "mandates" | "caseCategories" | "teams" | "referralResponseDays">) =>
    api.patch<RegulatoryAuthorityProfile>("/api/regulatory-authorities/me/profile", input).then((r) => r.data),
};
