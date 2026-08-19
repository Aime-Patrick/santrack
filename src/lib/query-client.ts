import { QueryClient } from "@tanstack/react-query";

/**
 * Single source of truth for React Query defaults. Configured once here,
 * created per client session in the provider (avoids cache sharing
 * across SSR requests).
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
