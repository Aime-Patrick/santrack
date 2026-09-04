import { useQuery } from "@tanstack/react-query";
import { regulatoryOversightService } from "@/services/regulatory-oversight.service";
export function useRegulatoryOversightSummary(enabled: boolean) { return useQuery({ queryKey: ["regulatory-oversight", "summary"], queryFn: regulatoryOversightService.summary, enabled, retry: false }); }
