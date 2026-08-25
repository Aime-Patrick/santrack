import { redirect } from "next/navigation";

/**
 * Retired route, kept as a redirect. This is now a tab on the screen it always
 * belonged to; saved links still land on it.
 */
export default function TransportersRedirect() {
  redirect("/dashboard/logistics/vehicles?tab=transporters");
}
