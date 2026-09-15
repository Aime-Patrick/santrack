import { redirect } from "next/navigation";

export default function PackRedirect() {
  redirect("/dashboard/manufacturing/trace");
}
