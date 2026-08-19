import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saleService, type SellInput } from "@/services/sale.service";

export const saleKeys = {
  all: ["sales"] as const,
  list: (page: number, size: number) => [...saleKeys.all, "list", page, size] as const,
};

export function useSales(page = 0, size = 20) {
  return useQuery({
    queryKey: saleKeys.list(page, size),
    queryFn: () => saleService.list(page, size),
  });
}

export function useSell() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SellInput) => saleService.sell(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: saleKeys.all });
    },
  });
}
