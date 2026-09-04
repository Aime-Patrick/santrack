"use client";

import { use } from "react";
import { BatchJourneyView } from "@/components/trace/batch-journey-view";

export default function BatchJourneyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const batchId = parseInt(resolvedParams.id, 10);

  return (
    <div className="mx-auto flex max-w-6xl flex-1 flex-col gap-6 p-4 md:p-8">
      <BatchJourneyView batchId={batchId} />
    </div>
  );
}
