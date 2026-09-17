"use client";

import { useState } from "react";
import {
  ArrowLeftRight,
  ArrowRightLeft,
  Inbox,
  Send,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOutgoingTransfers, useIncomingTransfers, useReceiveTransfer } from "@/hooks/transfers";
import { cn } from "@/lib/utils";
import type { Transfer } from "@/services/transfer.service";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "border-warning/30  bg-warning/10  text-warning-foreground",
  DISPATCHED:"border-primary/30  bg-primary/10  text-primary",
  RECEIVED:  "border-success/30  bg-success/10  text-success",
  CANCELLED: "border-border/60   bg-muted/50    text-muted-foreground",
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  PENDING:   Clock,
  DISPATCHED:Send,
  RECEIVED:  CheckCircle,
  CANCELLED: XCircle,
};

function StatusBadge({ status }: { status: string }) {
  const Icon = STATUS_ICONS[status] ?? Clock;
  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1 text-[13px] font-semibold px-2 py-0.5",
        STATUS_STYLES[status] ?? "border-border/60 bg-muted/50 text-muted-foreground"
      )}
    >
      <Icon className="size-3" />
      {status}
    </Badge>
  );
}

// ─── Transfer row ─────────────────────────────────────────────────────────────

function TransferRow({
  transfer,
  direction,
  onReceive,
  receiving,
}: {
  transfer: Transfer;
  direction: "outgoing" | "incoming";
  onReceive?: (id: number) => void;
  receiving?: boolean;
}) {
  const counterparty =
    direction === "outgoing"
      ? transfer.destinationOrganizationName
      : transfer.sourceOrganizationName;

  const dateLabel =
    transfer.receivedAt
      ? `Received ${new Date(transfer.receivedAt).toLocaleDateString()}`
      : transfer.dispatchedAt
      ? `Dispatched ${new Date(transfer.dispatchedAt).toLocaleDateString()}`
      : "Not yet dispatched";

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card px-4 py-3 hover:bg-muted/30 transition-colors">
      {/* Icon */}
      <div className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg",
        direction === "outgoing" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
      )}>
        {direction === "outgoing" ? <Send className="size-4" /> : <Inbox className="size-4" />}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground font-mono">
            {transfer.reference}
          </span>
          <StatusBadge status={transfer.status} />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {direction === "outgoing" ? "→" : "←"} {counterparty}
          {transfer.destinationLocationName && ` · ${transfer.destinationLocationName}`}
        </p>
        <p className="text-[13px] text-muted-foreground/70 mt-0.5">{dateLabel}</p>
      </div>

      {/* Line count */}
      <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <Package className="size-3.5" />
        {transfer.lineCount} item{transfer.lineCount !== 1 ? "s" : ""}
      </div>

      {/* Receive action */}
      {direction === "incoming" && transfer.status === "DISPATCHED" && onReceive && (
        <button
          type="button"
          onClick={() => onReceive(transfer.id)}
          disabled={receiving}
          className="flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white hover:bg-success/90 disabled:opacity-60 transition-colors shrink-0"
        >
          {receiving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <CheckCircle className="size-3.5" />
          )}
          Receive
        </button>
      )}

      <ChevronRight className="size-4 text-muted-foreground/40 shrink-0" />
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

function OutgoingPanel() {
  const { data, isLoading } = useOutgoingTransfers(0, 50);
  const transfers = data?.content ?? [];

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading outgoing transfers…
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
        <Send className="size-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No outgoing transfers yet</p>
        <p className="text-xs text-muted-foreground/70">
          Use <strong>Transfer stock</strong> from the Inventory page to dispatch items
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transfers.map((t) => (
        <TransferRow key={t.id} transfer={t} direction="outgoing" />
      ))}
    </div>
  );
}

function IncomingPanel() {
  const { data, isLoading } = useIncomingTransfers(false, 0, 50);
  const receive = useReceiveTransfer();
  const [receivingId, setReceivingId] = useState<number | null>(null);
  const transfers = data?.content ?? [];

  function handleReceive(id: number) {
    setReceivingId(id);
    receive.mutate(
      { transferId: id },
      { onSettled: () => setReceivingId(null) }
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading incoming transfers…
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
        <Inbox className="size-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No incoming transfers</p>
        <p className="text-xs text-muted-foreground/70">
          Transfers dispatched to your organization appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transfers.map((t) => (
        <TransferRow
          key={t.id}
          transfer={t}
          direction="incoming"
          onReceive={handleReceive}
          receiving={receivingId === t.id}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StockMovementPage() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <ArrowLeftRight className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Stock Movement</h1>
          <p className="text-sm text-muted-foreground">
            All stock dispatched to or received from other organizations.
          </p>
        </div>
      </div>

      <Tabs defaultValue="incoming" className="space-y-4">
        <TabsList className="rounded-xl border border-border/80 bg-muted/50 p-1">
          <TabsTrigger value="incoming" className="gap-2">
            <Inbox className="size-4" />
            Incoming
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="gap-2">
            <Send className="size-4" />
            Outgoing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Incoming transfers</CardTitle>
              <CardDescription>
                Stock dispatched to your organization. Click <strong>Receive</strong> to confirm receipt and update inventory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IncomingPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outgoing">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Outgoing transfers</CardTitle>
              <CardDescription>
                Stock you have dispatched to other organizations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OutgoingPanel />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
