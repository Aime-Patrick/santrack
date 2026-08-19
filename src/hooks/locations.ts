"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { locationService, type CreateLocationInput } from "@/services/location.service";
import { toast } from "sonner";

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: () => locationService.list(),
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLocationInput) => locationService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location created");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create location");
    },
  });
}
