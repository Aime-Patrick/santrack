import { redirect } from "next/navigation";

/**
 * Retired route, kept as a redirect.
 *
 * This stage is now a tab on Sales, because a quotation, an order, an invoice
 * and a return are one deal moving through its life rather than four places to
 * visit. Saved links keep working and land on the stage they named.
 */
export default function QuotationsRedirect() {
  redirect("/dashboard/sales?tab=quotations");
}
