import { redirect } from "next/navigation";

/**
 * Retired screen, kept as a redirect.
 *
 * The third screen answering "what is this code?". Trace & Act is the one
 * that scans, resolves and offers the lifecycle actions the caller is actually
 * permitted to take.
 *
 * A redirect rather than a deletion so that bookmarks, pasted links and
 * anything printed with this path still arrive somewhere useful.
 */
export default function ScanRedirect() {
  redirect("/dashboard/manufacturing/trace");
}
