import { useQuery } from "@tanstack/react-query";
import { regulatoryCommandService } from "@/services/regulatory-command.service";

export function useRegulatoryCommand() {
  return useQuery({ queryKey: ["regulatory-command"], queryFn: regulatoryCommandService.summary, staleTime: 15_000 });
}
