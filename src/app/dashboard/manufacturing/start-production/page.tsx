import { redirect } from "next/navigation";

/**
 * Retired multi-step wizard, redirected to the unified Production workspace.
 *
 * Production logging is now handled directly in one step on /dashboard/manufacturing/production.
 */
export default function StartProductionRedirect() {
  redirect("/dashboard/manufacturing/production");
}
