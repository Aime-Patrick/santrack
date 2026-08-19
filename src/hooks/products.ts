"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService, type CreateProductInput } from "@/services/product.service";
import { toast } from "sonner";

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
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create product");
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CreateProductInput }) =>
      productService.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update product");
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
