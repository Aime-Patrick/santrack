import { useQuery } from "@tanstack/react-query";
import { regulatorySignalService } from "@/services/regulatory-signal.service";

export function useRegulatorySignals() {
  return useQuery({ queryKey: ["regulatory-signals"], queryFn: regulatorySignalService.list, staleTime: 30_000 });
}
