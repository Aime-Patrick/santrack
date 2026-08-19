import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import type { RegisterInput, LoginInput, CreateOrganizationInput, UserResponse, UserRole } from "@/lib/api";
import { clearAuthToken, getAuthToken, setAuthToken } from "@/lib/auth";

const DESIGN_MODE = process.env.NEXT_PUBLIC_DESIGN_MODE === "true";

/** Build a mock user for a given role in design mode. */
function mockUser(role: UserRole): UserResponse {
  return {
    id: 1,
    email: `admin@santrack.rw`,
    fullName: "Design Admin",
    role,
    organization: null,
  };
}

// Query key factory — never inline these strings.
export const authKeys = {
  me: ["auth", "me"] as const,
};

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

/** Logs in, stores the token, and seeds the /me cache. */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
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
export function useMe({ enabled = true, previewRole }: { enabled?: boolean; previewRole?: UserRole } = {}) {
  // In design mode, the query is always disabled (no backend) and the
  // cache is keyed by the current preview role so React Query swaps
  // the mock user whenever the role changes.
  const designRole: UserRole = previewRole ?? "SYSTEM_ADMIN";

  return useQuery<UserResponse>({
    queryKey: DESIGN_MODE ? [...authKeys.me, "design", designRole] : authKeys.me,
    queryFn: authService.me,
    enabled: !DESIGN_MODE && enabled && typeof window !== "undefined" && !!getAuthToken(),
    staleTime: 5 * 60_000,
    retry: false,
    ...(DESIGN_MODE ? { initialData: mockUser(designRole) } : {}),
  });
}

/** Clears the token and drops the cached user. */
export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    clearAuthToken();
    queryClient.removeQueries({ queryKey: authKeys.me });
  };
}
