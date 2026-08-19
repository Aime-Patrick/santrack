import { useQuery } from "@tanstack/react-query";
import { organizationService } from "@/services/organization.service";

export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: () => organizationService.list(),
  });
}
