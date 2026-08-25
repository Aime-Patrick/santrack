import { redirect } from "next/navigation";

/**
 * Retired sub-route, kept as a redirect.
 *
 * A product's lots are one tab of the product, not a page away from it. Reaching it meant leaving the product, so the two facts a person was
 * comparing could never be on screen together.
 *
 * A redirect rather than a deletion so saved links still land in the right place.
 */
export default async function ProductBatchesRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/products/${id}?tab=batches`);
}
