import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import type {
  CreateUserInput,
  UpdateUserInput,
  ResetPasswordInput,
  SetUserCapabilitiesInput,
} from "@/lib/api";

export const userKeys = {
  all: ["users"] as const,
  list: (orgId?: number) => [...userKeys.all, "list", orgId] as const,
  detail: (id: number) => [...userKeys.all, id] as const,
};

export function useUsers(organizationId?: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userKeys.list(organizationId),
    queryFn: () => userService.list(organizationId),
    enabled: options?.enabled ?? true,
  });
}

export function useUser(userId: number) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userService.get(userId),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => userService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: number; input: UpdateUserInput }) =>
      userService.update(userId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ userId, input }: { userId: number; input: ResetPasswordInput }) =>
      userService.resetPassword(userId, input),
  });
}

export function useResendInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => userService.resendInvite(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useResendOrgAdminInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (organizationId: number) => userService.resendOrgAdminInvite(organizationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useRemoveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => userService.remove(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useSetUserCapabilities() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: number;
      input: SetUserCapabilitiesInput;
    }) => userService.setCapabilities(userId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}
