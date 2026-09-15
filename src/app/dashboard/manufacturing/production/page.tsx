import { redirect } from "next/navigation";

/**
 * Daily production work is the Manufacturing pipeline. This table view was a
 * second place to do the same job — redirect so there is one home for runs.
 */
export default function ProductionOrdersRedirectPage() {
  redirect("/dashboard/manufacturing");
}
