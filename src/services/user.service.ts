import { api, type UserResponse, type CreateUserInput, type CreateUserResponse, type UpdateUserInput, type ResetPasswordInput } from "@/lib/api";

export const userService = {
  list(organizationId?: number): Promise<UserResponse[]> {
    const params = organizationId ? { organizationId } : undefined;
    return api.get<UserResponse[]>("/api/users", { params }).then((r) => r.data);
  },

  get(userId: number): Promise<UserResponse> {
    return api.get<UserResponse>(`/api/users/${userId}`).then((r) => r.data);
  },

  create(input: CreateUserInput): Promise<CreateUserResponse> {
    return api.post<CreateUserResponse>("/api/users", input).then((r) => r.data);
  },

  update(userId: number, input: UpdateUserInput): Promise<UserResponse> {
    return api.patch<UserResponse>(`/api/users/${userId}`, input).then((r) => r.data);
  },

  resetPassword(userId: number, input: ResetPasswordInput): Promise<void> {
    return api.post(`/api/users/${userId}/reset-password`, input).then(() => undefined);
  },

  resendInvite(userId: number): Promise<{ temporaryPassword?: string; email?: string }> {
    return api.post<{ temporaryPassword?: string; email?: string }>(`/api/users/${userId}/resend-invite`).then((r) => r.data);
  },

  resendOrgAdminInvite(organizationId: number): Promise<{ temporaryPassword?: string; email?: string }> {
    return api.post<{ temporaryPassword?: string; email?: string }>(`/api/users/resend-org-admin-invite/${organizationId}`).then((r) => r.data);
  },

  remove(userId: number): Promise<void> {
    return api.delete(`/api/users/${userId}`).then(() => undefined);
  },
};
