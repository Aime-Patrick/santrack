import { redirect } from "next/navigation";

/**
 * Package registration lives on the Manufacturing pipeline now
 * (approved lots → Register package). Keep this path as a redirect so
 * bookmarks and old links still land in the right place.
 */
export default function RegisterPackageRedirectPage() {
  redirect("/dashboard/manufacturing");
}
