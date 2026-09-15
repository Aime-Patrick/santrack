import { redirect } from "next/navigation";

export default function InventoryNewRedirect() {
  redirect("/dashboard/inventory");
}
