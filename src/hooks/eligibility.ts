"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { productionService, type ProductionOrder } from "@/services/manufacturing.service";
import {
  eligibilityService,
  type EligibilityQuery,
  type EligibilityResult,
} from "@/services/eligibility.service";
import { previewEligibility } from "@/lib/compliance-fixtures";
import { complianceKeys } from "./compliance";

/** Preview only. See the warning at the top of `lib/compliance-fixtures.ts`. */
const DESIGN_MODE = process.env.NEXT_PUBLIC_DESIGN_MODE === "true";

export const eligibilityKeys = {
  all: ["production-eligibility"] as const,
  preview: (query: EligibilityQuery) =>
    [
      ...eligibilityKeys.all,
      query.productId,
      query.facilityId ?? null,
      query.quantity,
      query.date,
    ] as const,
};

/**
 * Holds a value still for `delay` before letting it through.
 *
 * The eligibility endpoint is a pure read and safe to call freely, but asking
 * the server eight regulatory questions for every digit of a quantity is waste,
 * not safety.
 */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return settled;
}

/**
 * The server's eligibility decision for a proposed run.
 *
 * `enabled` is the only judgement this hook makes, and it is about whether the
 * form has been filled in — not about whether the run is permitted. Every
 * regulatory field in the answer (`eligible`, `blocking`, each check's status)
 * arrives decided and is rendered as it stands.
 */
export function useProductionEligibility(
  query: Partial<EligibilityQuery>,
  options: { enabled?: boolean } = {},
) {
  const complete =
    typeof query.productId === "number" &&
    query.productId > 0 &&
    typeof query.quantity === "number" &&
    query.quantity > 0 &&
    !!query.date;

  const settled = query as EligibilityQuery;

  return useQuery<EligibilityResult>({
    queryKey: eligibilityKeys.preview(settled),
    queryFn: () =>
      DESIGN_MODE
        ? Promise.resolve(previewEligibility(settled))
        : eligibilityService.preview(settled),
    enabled: complete && options.enabled !== false,
    // The preview is a snapshot of a moment; it is never served from cache on a
    // later visit, because a licence may have been suspended in between.
    staleTime: 0,
    gcTime: 0,
    retry: false,
    placeholderData: keepPreviousData,
  });
}

/**
 * Creates the production order.
 *
 * Deliberately no error toast: a refusal carries the failing checks and the
 * remedy, and "Request failed with status code 409" in the corner of the screen
 * is precisely the outcome DR-07 WU-9 exists to prevent. The wizard renders the
 * payload instead.
 */
export function useCreateProductionRun() {
  const qc = useQueryClient();

  return useMutation<
    ProductionOrder,
    Error,
    {
      productId: number;
      plannedQuantity: number;
      facilityId?: number;
      scheduledStartOn?: string;
      notes?: string;
    }
  >({
    mutationFn: (input) => productionService.create(input),
    onSuccess: () => {
      // Planning an order opens its batch, and records an eligibility decision.
      qc.invalidateQueries({ queryKey: ["production-orders"] });
      qc.invalidateQueries({ queryKey: ["batches"] });
      qc.invalidateQueries({ queryKey: complianceKeys.all });
      toast.success("Production order created");
    },
  });
}
