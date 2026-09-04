"use client";

import { useQuery } from "@tanstack/react-query";
import { parsePoolLabelCsv } from "@/lib/label-studio";
import { identityPoolService } from "@/services/identity-pool.service";

export const labelStudioKeys = {
  rows: (poolId: number) => ["label-studio", "rows", poolId] as const,
};

export function usePoolLabelRows(poolId: number | null) {
  return useQuery({
    queryKey: labelStudioKeys.rows(poolId ?? 0),
    queryFn: async () => {
      const blob = await identityPoolService.export(poolId as number);
      return parsePoolLabelCsv(await blob.text());
    },
    enabled: poolId !== null && poolId > 0,
    staleTime: 60_000,
  });
}
