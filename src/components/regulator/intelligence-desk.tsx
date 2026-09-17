"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ComplaintTriage } from "@/components/regulator/complaint-triage";
import { SignalWatch } from "@/components/regulator/signal-watch";
import { useRegulatoryComplaints } from "@/hooks/regulatory-complaints";
import { useRegulatorySignals } from "@/hooks/regulatory-signals";
import { FLAG_BLUE } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";

const INTEL_TABS = [
  { id: "market", label: "Market signals" },
  { id: "patterns", label: "Pattern watch" },
] as const;

type IntelTab = (typeof INTEL_TABS)[number]["id"];

export function IntelligenceDesk() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const intel: IntelTab = searchParams.get("intel") === "patterns" ? "patterns" : "market";
  const { data: complaints = [] } = useRegulatoryComplaints();
  const { data: signals = [] } = useRegulatorySignals();

  function setIntel(id: IntelTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "intelligence");
    if (id === "market") params.delete("intel");
    else params.set("intel", id);
    router.replace(`/dashboard/regulator?${params.toString()}`, { scroll: false });
  }

  const counts: Record<IntelTab, number> = {
    market: complaints.length,
    patterns: signals.length,
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl border border-border bg-muted/50 p-1">
        {INTEL_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setIntel(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
              intel === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            <Badge className={intel === id ? FLAG_BLUE : "bg-muted-foreground text-white"}>
              {counts[id]}
            </Badge>
          </button>
        ))}
      </div>
      {intel === "market" ? <ComplaintTriage /> : <SignalWatch />}
    </div>
  );
}
