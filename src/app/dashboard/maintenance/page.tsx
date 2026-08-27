import { redirect } from "next/navigation";

/**
 * Retired route. Maintenance lives under Settings → Maintenance so operators
 * do not hunt the same job in two places.
 */
export default function MaintenanceRedirect() {
  redirect("/dashboard/settings?tab=maintenance");
}
