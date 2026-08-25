import { redirect } from "next/navigation";

/**
 * The third screen that answered "what is this code?", now the same one.
 *
 * Product Lifecycle showed an item, its timeline and six lifecycle buttons —
 * a subset of Trace & Act. It was the worst of the three to be left on:
 *
 *  - It had no scanner at all, just a text box reading "Enter QR code to
 *    track...". Nobody types `ST-QR-000001-4F2A9C` off a label.
 *  - Its lifecycle buttons were drawn unconditionally, so a sales officer was
 *    shown Destroy and got a 403 for pressing it.
 *
 * The `?qr=` links it was reached by still work: the console reads both
 * `?code=` and `?qr=`.
 */
export default async function ProductLifecycleRedirect({
  searchParams,
}: {
  searchParams: Promise<{ qr?: string }>;
}) {
  const { qr } = await searchParams;
  redirect(
    qr
      ? `/dashboard/manufacturing/trace?code=${encodeURIComponent(qr)}`
      : "/dashboard/manufacturing/trace",
  );
}
