"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { organizationService } from "@/services/organization.service";
import { getApiErrorMessage } from "@/lib/api";
import type { OrganizationType } from "@/lib/api";

// ---------------------------------------------------------------------------
// Schema — name, type, TIN (+ optional registration number)
// ---------------------------------------------------------------------------

const industrySchema = z.object({
  name: z.string().min(2, "Industry name is required"),
  type: z.string().min(1, "Category is required"),
  registrationNumber: z.string().optional(),
  tinNumber: z.string().trim().min(5, "Enter a valid TIN"),
  province: z.string().optional(),
  district: z.string().optional(),
  sector: z.string().optional(),
  establishedDate: z.string().optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().optional(),
});

export type IndustryFormValues = z.infer<typeof industrySchema>;

/** Maps the UI category value to the backend OrganizationType. */
const TYPE_MAP: Record<string, OrganizationType> = {
  manufacturing: "MANUFACTURER",
  "agro-processing": "MANUFACTURER",
  mining: "MANUFACTURER",
  construction: "MANUFACTURER",
  others: "MANUFACTURER",
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useIndustryForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<IndustryFormValues>({
    resolver: zodResolver(industrySchema),
    defaultValues: {
      name: "",
      type: "",
      registrationNumber: "",
      tinNumber: "",
      province: "",
      district: "",
      sector: "",
      establishedDate: "",
      description: "",
      phone: "",
      email: "",
      website: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: IndustryFormValues) =>
      organizationService.create({
        name: values.name,
        type: TYPE_MAP[values.type] ?? "MANUFACTURER",
        tin: values.tinNumber.trim(),
        registrationNumber: values.registrationNumber?.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Industry created successfully");
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      router.push("/dashboard/industries");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to create industry"));
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(values);
  });

  return {
    form,
    onSubmit,
    isSubmitting: mutation.isPending,
    error: mutation.error,
  };
}
