import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/services/report.service";

export function useReportData(name: string, enabled = false) {
  return useQuery({
    queryKey: ["report", name],
    queryFn: () => reportService.getData(name),
    enabled,
  });
}
