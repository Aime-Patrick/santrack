import { redirect } from "next/navigation";

/**
 * Retired route, kept as a redirect.
 *
 * This screen and /dashboard/inventory both answered "what stock do we have?"
 * from the same rows, in two layouts, under two menu entries — they even
 * exported the same function name. It is now the Items tab of Inventory, so
 * there is one answer to one question.
 */
export default function ItemsRedirect() {
  redirect("/dashboard/inventory?tab=items");
}
