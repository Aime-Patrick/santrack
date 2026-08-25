import { redirect } from "next/navigation";

/**
 * Retired sub-route, kept as a redirect.
 *
 * The product QR is printed from the Labels tab, next to the identities it prints. Reaching it meant leaving the product, so the two facts a person was
 * comparing could never be on screen together.
 *
 * A redirect rather than a deletion so saved links still land in the right place.
 */
export default async function ProductQrRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/products/${id}?tab=labels`);
}
