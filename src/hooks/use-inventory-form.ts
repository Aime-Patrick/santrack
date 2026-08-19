"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { productService } from "@/services/product.service";
import { getApiErrorMessage } from "@/lib/api";

// ---------------------------------------------------------------------------
// Schema — maps to CreateProductDto (name, sku, category, brand, specification)
// ---------------------------------------------------------------------------

const inventorySchema = z.object({
  name: z.string().min(1, "Item name is required"),
  code: z.string().min(1, "Item code is required"),
  category: z.string().min(1, "Category is required"),
  unitOfMeasure: z.string().min(1, "Unit of measure is required"),
  description: z.string().optional(),
  reorderLevel: z.number().min(0, "Must be 0 or more").optional(),
  minimumStock: z.number().min(0, "Must be 0 or more").optional(),
  maximumStock: z.number().min(0, "Must be 0 or more").optional(),
  unitCost: z.number().min(0, "Must be 0 or more").optional(),
  supplier: z.string().optional(),
  supplierContact: z.string().optional(),
  supplierPhone: z.string().optional(),
});

export type InventoryFormValues = z.infer<typeof inventorySchema>;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useInventoryForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: "",
      code: "",
      category: "",
      unitOfMeasure: "",
      description: "",
      reorderLevel: undefined,
      minimumStock: undefined,
      maximumStock: undefined,
      unitCost: undefined,
      supplier: "",
      supplierContact: "",
      supplierPhone: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: InventoryFormValues) =>
      productService.create({
        name: values.name,
        sku: values.code,
        category: values.category,
        brand: values.supplier || undefined,
        specification: [
          values.description,
          values.unitOfMeasure ? `UoM: ${values.unitOfMeasure}` : "",
          values.unitCost ? `Cost: ${values.unitCost} RWF` : "",
          values.reorderLevel ? `Reorder: ${values.reorderLevel}` : "",
        ]
          .filter(Boolean)
          .join(" | ") || undefined,
      }),
    onSuccess: () => {
      toast.success("Inventory item created successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push("/dashboard/items");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to create inventory item"));
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
