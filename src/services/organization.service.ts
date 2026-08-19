import { api, type OrganizationResponse, type CreateOrganizationInput } from "@/lib/api";

export const organizationService = {
  create(input: CreateOrganizationInput): Promise<OrganizationResponse> {
    return api.post<OrganizationResponse>("/api/organizations", input).then((r) => r.data);
  },

  list(): Promise<OrganizationResponse[]> {
    return api.get<OrganizationResponse[]>("/api/organizations").then((r) => r.data);
  },
};
