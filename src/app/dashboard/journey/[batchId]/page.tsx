"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Legacy route — redirects to Trace & Act with the batch ID as a query param.
 * The old journey page lacked discrepancy rollup; Trace & Act has it.
 */
export default function BatchJourneyPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const batchId = Number(use(params).batchId);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/dashboard/manufacturing/trace?code=${batchId}`);
  }, [batchId, router]);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 className="size-5 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Redirecting to Trace & Act…</p>
    </div>
  );
}
