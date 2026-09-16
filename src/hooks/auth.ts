import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import type { ResetPasswordInput } from "@/services/auth.service";
import type {
  AuthResponse,
  RegisterInput,
  LoginInput,
  LoginResponse,
  CreateOrganizationInput,
  ChangePasswordInput,
  UserResponse,
  UserRole,
} from "@/lib/api";
import { clearAuthToken, getAuthToken, hasSessionMarker, setAuthToken } from "@/lib/auth";
import {
  PREVIEW_ROLE_CAPABILITIES,
  PREVIEW_STANDING_CAPABILITIES,
} from "@/lib/design-fixtures";

const DESIGN_MODE = process.env.NEXT_PUBLIC_DESIGN_MODE === "true";

/**
 * Build a mock user for a given role in design mode.
 *
 * The capability list is the preview fixture, not the real table — see
 * `design-fixtures.ts`. Outside design mode this function is never called and
 * capabilities arrive from the server.
 */
function mockUser(role: UserRole, standing = false): UserResponse {
  return {
    id: 1,
    email: `admin@santrack.rw`,
    fullName: "Design Admin",
    role,
    organization: null,
    mustChangePassword: false,
    mfaEnabled: false,
    mustEnableMfa: false,
    avatarUrl: null,
    avatarUploaded: false,
    capabilities: [
      ...PREVIEW_ROLE_CAPABILITIES[role],
      ...(standing
        ? PREVIEW_STANDING_CAPABILITIES.filter(
            (c) => !PREVIEW_ROLE_CAPABILITIES[role].includes(c),
          )
        : []),
    ],
  };
}

// Query key factory — never inline these strings.
export const authKeys = {
  me: ["auth", "me"] as const,
};

function isMfaChallenge(
  data: LoginResponse,
): data is { mfaRequired: true; mfaToken: string } {
  return "mfaRequired" in data && data.mfaRequired === true;
}

/**
 * Registers an account and stores the returned token. The /me cache is
 * seeded from the response so authenticated screens don't refetch.
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterInput) => authService.register(input),
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}

/** Logs in. May return an MFA challenge instead of a session. */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: (data) => {
      if (isMfaChallenge(data)) return;
      setAuthToken(data.token);
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}

export function useVerifyMfaLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { mfaToken: string; code: string }) =>
      authService.verifyMfaLogin(input),
    onSuccess: (data: AuthResponse) => {
      setAuthToken(data.token);
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}

export function useBeginMfaSetup() {
  return useMutation({
    mutationFn: () => authService.beginMfaSetup(),
  });
}

export function useConfirmMfaSetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => authService.confirmMfaSetup(code),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

export function useDisableMfa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { password: string; code: string }) =>
      authService.disableMfa(input),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

/**
 * Emails a one-time reset link. Always resolves the same way whether the
 * account exists, so the form never leaks which emails are registered.
 */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => authService.requestPasswordReset(email),
  });
}

/** Sets a new password with the token from the emailed link. */
export function useResetPassword() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => authService.resetPassword(input),
  });
}

/** Replaces the caller's password and clears mustChangePassword. */
export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ChangePasswordInput) => authService.changePassword(input),
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}

/** Creates the user's organization (onboarding step). */
export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => authService.createOrganization(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

/**
 * Current authenticated user. Disabled unless a token exists; pass
 * `enabled: false` in design mode to avoid hitting a dead backend.
 *
 * In design mode, pass a `previewRole` to simulate a specific role.
 * When no previewRole is supplied the hook falls back to SYSTEM_ADMIN.
 */
export function useMe({
  enabled = true,
  previewRole,
  previewStanding = false,
}: {
  enabled?: boolean;
  previewRole?: UserRole;
  /** Design mode only: preview the user as staff of a licensing authority. */
  previewStanding?: boolean;
} = {}) {
  // In design mode, the query is always disabled (no backend) and the
  // cache is keyed by the current preview role so React Query swaps
  // the mock user whenever the role changes.
  const designRole: UserRole = previewRole ?? "SYSTEM_ADMIN";

  return useQuery<UserResponse>({
    queryKey: DESIGN_MODE
      ? [...authKeys.me, "design", designRole, previewStanding]
      : authKeys.me,
    queryFn: authService.me,
    enabled:
      !DESIGN_MODE &&
      enabled &&
      typeof window !== "undefined" &&
      (!!getAuthToken() || hasSessionMarker()),
    staleTime: 5 * 60_000,
    retry: false,
    ...(DESIGN_MODE ? { initialData: mockUser(designRole, previewStanding) } : {}),
  });
}

/** Updates the caller's own display name. Refreshes the /me cache. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { fullName?: string }) => authService.updateProfile(dto),
    onSuccess: (updated) => {
      queryClient.setQueryData(authKeys.me, updated);
    },
  });
}

export function useSetLibraryAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (avatarUrl: string | null) =>
      authService.setLibraryAvatar(avatarUrl),
    onSuccess: (updated) => {
      queryClient.setQueryData(authKeys.me, updated);
      queryClient.removeQueries({ queryKey: [...authKeys.me, "avatar-blob"] });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => authService.uploadAvatar(file),
    onSuccess: (updated) => {
      queryClient.setQueryData(authKeys.me, updated);
      queryClient.invalidateQueries({
        queryKey: [...authKeys.me, "avatar-blob"],
      });
    },
  });
}

export function useClearAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authService.clearAvatar(),
    onSuccess: (updated) => {
      queryClient.setQueryData(authKeys.me, updated);
      queryClient.removeQueries({ queryKey: [...authKeys.me, "avatar-blob"] });
    },
  });
}

/** Clears the cookie session + local marker, drops the cached user, redirects. */
export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    void authService.logout().catch(() => undefined);
    clearAuthToken();
    queryClient.removeQueries({ queryKey: authKeys.me });
    window.location.href = "/login";
  };
}
