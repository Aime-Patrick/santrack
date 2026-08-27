"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  productService,
  type CreateCategoryInput,
  type CreateProductInput,
  type UpdateCategoryInput,
} from "@/services/product.service";
import { getApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export function useProductCategories() {
  return useQuery({
    queryKey: ["product-categories"],
    queryFn: productService.categories,
    staleTime: 10 * 60_000,
  });
}

export function useCategoryDetail(id: number | null) {
  return useQuery({
    queryKey: ["product-categories", id],
    queryFn: () => productService.getCategory(id!),
    enabled: id != null && id > 0,
  });
}

/**
 * Category writes.
 *
 * All three invalidate the same key the whole app reads categories from, so a
 * category created here appears in the product form's dropdown without a
 * reload. The server holds writes to ADMINISTER_PLATFORM; the UI hides them
 * from anyone else, and the API refuses them regardless.
 */
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) =>
      productService.createCategory(input),
    onSuccess: (category) => {
      qc.invalidateQueries({ queryKey: ["product-categories"] });
      toast.success(`${category.name} added to the taxonomy`);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not create that category")),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateCategoryInput & { id: number }) =>
      productService.updateCategory(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-categories"] });
      toast.success("Category updated");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not update that category")),
  });
}

export function useWithdrawCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productService.withdrawCategory(id),
    onSuccess: (category) => {
      qc.invalidateQueries({ queryKey: ["product-categories"] });
      toast.success(`${category.name} withdrawn`);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not withdraw that category")),
  });
}

export function useCategoryShareLink(categoryId: number | null) {
  return useQuery({
    queryKey: ["category-share-link", categoryId],
    queryFn: () => productService.getCategoryShareLink(categoryId!),
    enabled: categoryId != null,
  });
}

export function useRotateCategoryShareLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productService.rotateCategoryShareLink(id),
    onSuccess: (share) => {
      qc.invalidateQueries({ queryKey: ["category-share-link", share.categoryId] });
      toast.success("Share link regenerated — old QR codes no longer work");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not regenerate share link")),
  });
}

/** The organization's own brands. */
export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: productService.brands,
    staleTime: 5 * 60_000,
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => productService.createBrand(name),
    onSuccess: (brand) => {
      qc.invalidateQueries({ queryKey: ["brands"] });
      toast.success(`${brand.name} added to your brands`);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not create that brand")),
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: number;
      name?: string;
      active?: boolean;
    }) => productService.updateBrand(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand updated");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not update that brand")),
  });
}

export function useWithdrawBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productService.withdrawBrand(id),
    onSuccess: (brand) => {
      qc.invalidateQueries({ queryKey: ["brands"] });
      toast.success(`${brand.name} withdrawn`);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not withdraw that brand")),
  });
}

export function useProducts(page = 0, size = 20) {
  return useQuery({
    queryKey: ["products", page, size],
    queryFn: () => productService.list(page, size),
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productService.get(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput) => productService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created successfully");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Failed to create product"));
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CreateProductInput }) =>
      productService.update(id, input),
    onSuccess: (_product, { id }) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product", id] });
      toast.success("Product updated");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Failed to update product"));
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete product");
    },
  });
}
