"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type SearchHit = {
  type:
    | "product"
    | "category"
    | "batch"
    | "customer"
    | "item"
    | "organization"
    | "user";
  id: number;
  title: string;
  subtitle: string | null;
  href: string;
};

export type SearchResponse = {
  query: string;
  cached: boolean;
  results: SearchHit[];
};

export function useGlobalSearch(query: string, enabled: boolean) {
  const q = query.trim();
  return useQuery({
    queryKey: ["global-search", q.toLowerCase()],
    queryFn: () =>
      api
        .get<SearchResponse>("/api/search", { params: { q } })
        .then((r) => r.data),
    enabled: enabled && q.length >= 2,
    staleTime: 90_000,
    gcTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  });
}
