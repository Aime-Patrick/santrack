"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productRegistrationService } from "@/services/product-registration.service";
import type {
  ApplyProductRegistrationInput,
  ProductRegistrationStatus,
} from "@/lib/api";

export const PRODUCT_REG_KEYS = {
  all: ["product-registrations"] as const,
  lists: () => [...PRODUCT_REG_KEYS.all, "list"] as const,
  queue: () => [...PRODUCT_REG_KEYS.all, "queue"] as const,
  detail: (id: number) => [...PRODUCT_REG_KEYS.all, "detail", id] as const,
};

export function useMyProductRegistrations() {
  return useQuery({
    queryKey: PRODUCT_REG_KEYS.lists(),
    queryFn: () => productRegistrationService.list(),
  });
}

export function useProductRegistrationQueue() {
  return useQuery({
    queryKey: PRODUCT_REG_KEYS.queue(),
    queryFn: () => productRegistrationService.queue(),
  });
}

export function useProductRegistrationDetail(id: number) {
  return useQuery({
    queryKey: PRODUCT_REG_KEYS.detail(id),
    queryFn: () => productRegistrationService.get(id),
    enabled: id > 0,
  });
}

export function useApplyProductRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ApplyProductRegistrationInput) =>
      productRegistrationService.apply(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_REG_KEYS.all });
    },
  });
}

export function useAttachProductDocument(registrationId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentType,
      file,
    }: {
      documentType: string;
      file: File;
    }) =>
      productRegistrationService.attachDocument(
        registrationId,
        documentType,
        file,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PRODUCT_REG_KEYS.detail(registrationId),
      });
      queryClient.invalidateQueries({ queryKey: PRODUCT_REG_KEYS.lists() });
    },
  });
}

export function useSubmitProductRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productRegistrationService.submit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_REG_KEYS.all });
    },
  });
}

export function useCancelProductRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productRegistrationService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_REG_KEYS.all });
    },
  });
}

export function useStartProductReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productRegistrationService.startReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_REG_KEYS.all });
    },
  });
}

export function useDecideProductRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
    }: {
      id: number;
      decision: {
        decision: "APPROVE" | "REJECT";
        reason?: string;
        expiresOn?: string;
      };
    }) => productRegistrationService.decide(id, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_REG_KEYS.all });
    },
  });
}

export function productStatusColor(status: ProductRegistrationStatus): string {
  switch (status) {
    case "APPROVED":
      return "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case "SUBMITTED":
    case "UNDER_REVIEW":
      return "border-blue-600/30 bg-blue-500/10 text-blue-700 dark:text-blue-400";
    case "REJECTED":
    case "CANCELLED":
      return "border-red-600/30 bg-red-500/10 text-red-700 dark:text-red-400";
    case "SUSPENDED":
    case "EXPIRED":
      return "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case "DRAFT":
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

export function productStatusLabel(status: ProductRegistrationStatus): string {
  switch (status) {
    case "APPROVED":
      return "Approved & Authorized";
    case "UNDER_REVIEW":
      return "Under Technical Review";
    case "SUBMITTED":
      return "Submitted";
    case "REJECTED":
      return "Rejected";
    case "SUSPENDED":
      return "Suspended";
    case "EXPIRED":
      return "Expired";
    case "CANCELLED":
      return "Cancelled";
    case "DRAFT":
    default:
      return "Draft Dossier";
  }
}
