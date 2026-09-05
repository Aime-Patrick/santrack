import {
  api,
  type AuthResponse,
  type CapabilityCatalogue,
  type ChangePasswordInput,
  type CreateOrganizationInput,
  type LoginInput,
  type OrganizationResponse,
  type RegisterInput,
  type UserResponse,
} from "@/lib/api";

/** Always answers success (whether or not the account exists) - see service. */
export interface PasswordResetRequestResult {
  success: true;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export const authService = {
  register(input: RegisterInput): Promise<AuthResponse> {
    return api.post<AuthResponse>("/api/auth/register", input).then((r) => r.data);
  },

  login(input: LoginInput): Promise<AuthResponse> {
    return api.post<AuthResponse>("/api/auth/login", input).then((r) => r.data);
  },

  requestPasswordReset(email: string): Promise<PasswordResetRequestResult> {
    return api
      .post<PasswordResetRequestResult>("/api/auth/forgot-password", { email })
      .then((r) => r.data);
  },

  resetPassword(input: ResetPasswordInput): Promise<PasswordResetRequestResult> {
    return api
      .post<PasswordResetRequestResult>("/api/auth/reset-password", input)
      .then((r) => r.data);
  },

  changePassword(input: ChangePasswordInput): Promise<AuthResponse> {
    return api
      .post<AuthResponse>("/api/auth/change-password", input)
      .then((r) => r.data);
  },

  me(): Promise<UserResponse> {
    return api.get<UserResponse>("/api/auth/me").then((r) => r.data);
  },

  /** The role/capability reference table. Reference data, not the caller's. */
  capabilities(): Promise<CapabilityCatalogue> {
    return api
      .get<CapabilityCatalogue>("/api/auth/capabilities")
      .then((r) => r.data);
  },

  createOrganization(input: CreateOrganizationInput): Promise<OrganizationResponse> {
    return api.post<OrganizationResponse>("/api/organizations", input).then((r) => r.data);
  },
};
