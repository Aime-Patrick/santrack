"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api";
import {
  facilityService,
  type CreateFacilityInput,
  type UpdateFacilityInput,
} from "@/services/facility.service";
import { complianceKeys } from "./compliance";

export const facilityKeys = {
  all: ["facilities"] as const,
  list: () => [...facilityKeys.all, "list"] as const,
};

/** The organization's sites. `VIEW_OPERATIONS`. */
export function useFacilities() {
  return useQuery({
    queryKey: facilityKeys.list(),
    queryFn: facilityService.list,
    staleTime: 60_000,
  });
}

/**
 * Sites the server currently reports as open.
 *
 * Used by the production wizard to decide whether it must ask which plant is
 * producing. That is a question about *this list's length*, not about licensing
 * — the regulatory consequence of the answer is entirely the server's.
 */
export function useOpenFacilities() {
  const query = useFacilities();
  return { ...query, open: (query.data ?? []).filter((f) => f.active) };
}

export function useCreateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFacilityInput) => facilityService.create(input),
    onSuccess: (facility) => {
      qc.invalidateQueries({ queryKey: facilityKeys.all });
      // A new site changes the compliance picture: it either holds its own
      // licence or inherits the company's, and the server says which.
      qc.invalidateQueries({ queryKey: complianceKeys.all });
      toast.success(`${facility.name} opened`);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not open the site")),
  });
}

export function useUpdateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateFacilityInput }) =>
      facilityService.update(id, input),
    onSuccess: (facility) => {
      qc.invalidateQueries({ queryKey: facilityKeys.all });
      qc.invalidateQueries({ queryKey: complianceKeys.all });
      toast.success(`${facility.name} updated`);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not update the site")),
  });
}
