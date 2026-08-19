import { api, type AuthResponse, type UserResponse, type RegisterInput, type LoginInput, type CreateOrganizationInput, type OrganizationResponse } from "@/lib/api";

export const authService = {
  register(input: RegisterInput): Promise<AuthResponse> {
    return api.post<AuthResponse>("/api/auth/register", input).then((r) => r.data);
  },

  login(input: LoginInput): Promise<AuthResponse> {
    return api.post<AuthResponse>("/api/auth/login", input).then((r) => r.data);
  },

  me(): Promise<UserResponse> {
    return api.get<UserResponse>("/api/auth/me").then((r) => r.data);
  },

  createOrganization(input: CreateOrganizationInput): Promise<OrganizationResponse> {
    return api.post<OrganizationResponse>("/api/organizations", input).then((r) => r.data);
  },
};
