import { redirect } from "next/navigation";

/**
 * Retired screen, kept as a redirect.
 *
 * Moving stock between locations acts on stock you are already looking at,
 * so it belongs on Inventory as an action rather than as a destination you
 * navigate to and then have to find the stock again from.
 *
 * A redirect rather than a deletion so that bookmarks, pasted links and
 * anything printed with this path still arrive somewhere useful.
 */
export default function StockRelocateRedirect() {
  redirect("/dashboard/inventory");
}
