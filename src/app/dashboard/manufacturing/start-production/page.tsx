import { redirect } from "next/navigation";

/**
 * Retired multi-step wizard — production runs live on the Manufacturing pipeline.
 */
export default function StartProductionRedirectPage() {
  redirect("/dashboard/manufacturing");
}
