import { redirect } from "next/navigation";

/**
 * Retired screen, kept as a redirect.
 *
 * Registering units minted identities straight into stock, which is the
 * behaviour the pool lifecycle exists to replace: a code created that way said
 * a bottle existed at the moment the code was made. Codes are now prepared on
 * the product, claimed by a production order, and only become stock when
 * production confirms what was actually made (DR-08).
 *
 * A redirect rather than a deletion so that bookmarks, pasted links and
 * anything printed with this path still arrive somewhere useful.
 */
export default function RegisterUnitsRedirect() {
  redirect("/dashboard/products");
}
