import {
  api,
  type AuthResponse,
  type CapabilityCatalogue,
  type ChangePasswordInput,
  type CreateOrganizationInput,
  type LoginInput,
  type LoginResponse,
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

export interface MfaSetupResult {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

export const authService = {
  register(input: RegisterInput): Promise<AuthResponse> {
    return api.post<AuthResponse>("/api/auth/register", input).then((r) => r.data);
  },

  login(input: LoginInput): Promise<LoginResponse> {
    return api.post<LoginResponse>("/api/auth/login", input).then((r) => r.data);
  },

  verifyMfaLogin(input: { mfaToken: string; code: string }): Promise<AuthResponse> {
    return api
      .post<AuthResponse>("/api/auth/mfa/verify-login", input)
      .then((r) => r.data);
  },

  beginMfaSetup(): Promise<MfaSetupResult> {
    return api.post<MfaSetupResult>("/api/auth/mfa/setup").then((r) => r.data);
  },

  confirmMfaSetup(code: string): Promise<UserResponse> {
    return api
      .post<UserResponse>("/api/auth/mfa/confirm", { code })
      .then((r) => r.data);
  },

  disableMfa(input: { password: string; code: string }): Promise<UserResponse> {
    return api.post<UserResponse>("/api/auth/mfa/disable", input).then((r) => r.data);
  },

  logout(): Promise<{ success: true }> {
    return api.post<{ success: true }>("/api/auth/logout").then((r) => r.data);
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

  updateProfile(dto: { fullName?: string }): Promise<UserResponse> {
    return api.patch<UserResponse>("/api/auth/me", dto).then((r) => r.data);
  },

  setLibraryAvatar(avatarUrl: string | null): Promise<UserResponse> {
    return api
      .patch<UserResponse>("/api/auth/me/avatar", { avatarUrl })
      .then((r) => r.data);
  },

  uploadAvatar(file: File): Promise<UserResponse> {
    const body = new FormData();
    body.append("file", file);
    return api
      .post<UserResponse>("/api/auth/me/avatar", body, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  clearAvatar(): Promise<UserResponse> {
    return api.delete<UserResponse>("/api/auth/me/avatar").then((r) => r.data);
  },

  fetchAvatarBlob(): Promise<Blob> {
    return api
      .get<Blob>("/api/auth/me/avatar", { responseType: "blob" })
      .then((r) => r.data);
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
