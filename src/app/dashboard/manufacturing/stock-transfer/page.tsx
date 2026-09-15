import { redirect } from "next/navigation";

export default function StockTransferRedirect() {
  redirect("/dashboard/inventory?tab=transfer");
}
