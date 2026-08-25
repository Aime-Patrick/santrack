import { redirect } from "next/navigation";

/**
 * Retired screen, kept as a redirect.
 *
 * Printing a code is a thing you do to a product, so it now lives on the
 * product itself, under Labels - alongside the identities it prints and the
 * batches it belongs to. As a screen of its own it asked you to pick a product
 * from a dropdown of four hundred, which is the same choice you had already
 * made to get anywhere near it.
 *
 * A redirect rather than a deletion so that bookmarks, pasted links and
 * anything printed with this path still arrive somewhere useful.
 */
export default function CodeGeneratorRedirect() {
  redirect("/dashboard/products");
}
