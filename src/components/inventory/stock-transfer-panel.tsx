"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  Loader2,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { QrScanInput } from "@/components/ui/qr-scanner";
import { type ColumnDef } from "@tanstack/react-table";
import {
  useOutgoingTransfers,
  useIncomingTransfers,
  useDispatchTransfer,
  useReceiveTransfer,
} from "@/hooks/transfers";
import { useItem } from "@/hooks/items";
import { useLocations } from "@/hooks/locations";
import { useOrganizations } from "@/hooks/organizations";
import { useResolveCode } from "@/hooks/scan";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import type { ScanResult } from "@/services/scan.service";
import type { Transfer } from "@/services/transfer.service";

// ─── Columns ─────────────────────────────────────────────────────────────────

const outgoingColumns: ColumnDef<TableFeatures, Transfer>[] = [
  {
    accessorKey: "reference",
    header: "Reference",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("reference")}</span>
    ),
  },
  { accessorKey: "destinationOrganizationName", header: "Destination" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.getValue("status") as string;
      return (
        <Badge
          variant={
            s === "PENDING" ? "secondary" : s === "RECEIVED" ? "default" : "outline"
          }
        >
          {s}
        </Badge>
      );
    },
  },
  { accessorKey: "lineCount", header: "Items" },
  {
    accessorKey: "dispatchedAt",
    header: "Dispatched",
    cell: ({ row }) =>
      row.getValue("dispatchedAt")
        ? new Date(row.getValue("dispatchedAt") as string).toLocaleDateString()
        : "—",
  },
];

const incomingColumns: ColumnDef<TableFeatures, Transfer>[] = [
  {
    accessorKey: "reference",
    header: "Reference",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("reference")}</span>
    ),
  },
  { accessorKey: "sourceOrganizationName", header: "From" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.getValue("status") as string;
      return (
        <Badge
          variant={
            s === "PENDING" ? "secondary" : s === "RECEIVED" ? "default" : "outline"
          }
        >
          {s}
        </Badge>
      );
    },
  },
  { accessorKey: "lineCount", header: "Items" },
  {
    accessorKey: "dispatchedAt",
    header: "Dispatched",
    cell: ({ row }) =>
      row.getValue("dispatchedAt")
        ? new Date(row.getValue("dispatchedAt") as string).toLocaleDateString()
        : "—",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const t = row.original;
      if (t.status !== "DISPATCHED" && t.status !== "PARTIALLY_RECEIVED") return null;
      return <ReceiveButton transferId={t.id} />;
    },
  },
];

function ReceiveButton({ transferId }: { transferId: number }) {
  const receive = useReceiveTransfer();
  return (
    <Button
      size="sm"
      onClick={() => receive.mutate({ transferId })}
      disabled={receive.isPending}
    >
      <ArrowDownLeft className="mr-1 size-3" /> Receive
    </Button>
  );
}

// ─── Scanned item row ─────────────────────────────────────────────────────────

function ScannedItemRow({
  code,
  onRemove,
}: {
  code: string;
  onRemove: () => void;
}) {
  const { data: item, isLoading } = useItem(code);
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <Badge variant="outline" className="shrink-0 font-mono text-xs">
          {code}
        </Badge>
        {isLoading ? (
          <span className="text-xs text-muted-foreground">Loading…</span>
        ) : item ? (
          <span className="truncate text-xs text-muted-foreground">
            {item.productName ?? "Unknown"}
            {item.locationName ? ` — ${item.locationName}` : ""}
          </span>
        ) : (
          <span className="text-xs text-danger">Not found</span>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="ml-2 shrink-0 rounded-full p-0.5 hover:bg-muted"
      >
        <Trash2 className="size-3" />
      </button>
    </div>
  );
}

// ─── Dispatch form ────────────────────────────────────────────────────────────

function DispatchForm() {
  const [childCodes, setChildCodes] = useState<string[]>([]);
  const [destOrgId, setDestOrgId] = useState("");
  const [destLocId, setDestLocId] = useState("");
  const [destinationLocationName, setDestinationLocationName] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [scanLog, setScanLog] = useState<
    Array<{ id: number; code: string; tone: string; message: string }>
  >([]);

  const resolve = useResolveCode();
  const { data: locations } = useLocations();
  const { data: organizations } = useOrganizations();
  const dispatch = useDispatchTransfer();

  const locationList = locations ?? [];
  const orgList = (organizations ?? []).filter(
    (o) => o.type !== "REGULATOR" && o.type !== "CONSUMER",
  );

  const firstItem = useItem(childCodes[0] ?? "");
  const [adoptedFrom, setAdoptedFrom] = useState<number | null>(null);
  const [sourceLocId, setSourceLocId] = useState("");
  const scannedLocationId = firstItem.data?.locationId ?? null;
  if (scannedLocationId !== adoptedFrom) {
    setAdoptedFrom(scannedLocationId);
    setSourceLocId(scannedLocationId ? String(scannedLocationId) : "");
  }

  const note = (outcome: Omit<(typeof scanLog)[0], "id">) =>
    setScanLog((prev) =>
      [{ ...outcome, id: Date.now() + Math.random() }, ...prev].slice(0, 6),
    );

  const handleScan = async (raw: string) => {
    const code = raw.trim();
    if (!code) return;
    let result: ScanResult;
    try {
      result = await resolve.mutateAsync(code);
    } catch {
      note({ code, tone: "error", message: "Could not look that up" });
      return;
    }
    if (result.kind === "LOCATION") {
      setDestOrgId(String(result.organizationId ?? ""));
      setDestLocId(String(result.locationId ?? ""));
      setDestinationLocationName(result.describes);
      note({ code, tone: "destination", message: `Dispatching to ${result.describes}` });
      return;
    }
    if (result.kind !== "ITEM" || !result.itemQrCode) {
      note({ code, tone: "error", message: result.describes });
      return;
    }
    if (childCodes.includes(result.itemQrCode)) {
      note({ code, tone: "ignored", message: "Already on the list" });
      return;
    }
    setChildCodes((prev) => [...prev, result.itemQrCode!]);
    note({ code, tone: "added", message: result.describes });
  };

  const removeCode = (code: string) => {
    setChildCodes((prev) => {
      const next = prev.filter((c) => c !== code);
      if (next.length === 0) setSourceLocId("");
      return next;
    });
  };

  const onDispatch = () => {
    const valid = childCodes.filter((c) => c.trim());
    if (!valid.length || !destOrgId) return;
    dispatch.mutate(
      {
        destinationOrganizationId: Number(destOrgId),
        destinationLocationId: destLocId ? Number(destLocId) : undefined,
        sourceLocationId: sourceLocId ? Number(sourceLocId) : undefined,
        itemQrCodes: valid,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setChildCodes([]);
          setDestOrgId("");
          setDestLocId("");
          setSourceLocId("");
          setNotes("");
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispatch items</CardTitle>
        <CardDescription>
          Scan goods, then scan a receiving bay label or pick a destination
          business below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <QrScanInput
          onScan={handleScan}
          scanning="goods, then the destination bay"
          placeholder="Scan a unit QR or bay label…"
        />

        {resolve.isPending && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Working out what that was…
          </p>
        )}

        {scanLog.length > 0 && (
          <div className="space-y-1">
            {scanLog.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs",
                  entry.tone === "added" && "bg-success/10 text-success",
                  entry.tone === "destination" && "bg-primary/10 text-primary",
                  entry.tone === "ignored" && "bg-muted text-muted-foreground",
                  entry.tone === "error" && "bg-danger/10 text-danger",
                )}
              >
                {entry.tone === "error" ? (
                  <AlertCircle className="size-3.5 shrink-0" />
                ) : entry.tone === "destination" ? (
                  <MapPin className="size-3.5 shrink-0" />
                ) : entry.tone === "ignored" ? (
                  <Info className="size-3.5 shrink-0" />
                ) : (
                  <Plus className="size-3.5 shrink-0" />
                )}
                <span className="font-mono font-medium">{entry.code}</span>
                <span className="truncate opacity-80">{entry.message}</span>
              </div>
            ))}
          </div>
        )}

        {childCodes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Going out ({childCodes.length})
            </p>
            {childCodes.map((code) => (
              <ScannedItemRow
                key={code}
                code={code}
                onRemove={() => removeCode(code)}
              />
            ))}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">From</p>
              <p className="text-sm text-foreground">
                {sourceLocId
                  ? (locationList.find((l) => String(l.id) === sourceLocId)?.name ?? `Location ${sourceLocId}`)
                  : "Taken from the first item you scan"}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "flex items-start gap-2 rounded-lg border px-3 py-2.5",
              destOrgId ? "border-primary/30 bg-primary/10" : "border-dashed border-border bg-muted/30",
            )}
          >
            <MapPin className={cn("mt-0.5 size-4 shrink-0", destOrgId ? "text-primary" : "text-muted-foreground")} />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">To</p>
              <SearchableSelect
                value={destOrgId || undefined}
                onValueChange={(v) => { setDestOrgId(v ?? ""); setDestLocId(""); setDestinationLocationName(null); }}
                placeholder="Choose destination business…"
                searchPlaceholder="Search businesses…"
                allowClear
                emptyMessage="No trading partners available."
                items={orgList.map((org) => ({ value: String(org.id), label: org.name, badge: org.type }))}
              />
              {destinationLocationName ? (
                <p className="text-xs text-muted-foreground">
                  Bay from scan: <span className="font-medium text-foreground">{destinationLocationName}</span>
                  {" · "}
                  <button type="button" onClick={() => { setDestLocId(""); setDestinationLocationName(null); }} className="underline-offset-2 hover:underline">
                    Clear bay
                  </button>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Or scan the receiving bay label to set both at once.
                </p>
              )}
            </div>
          </div>
        </div>

        <Input
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <Button
          onClick={onDispatch}
          disabled={dispatch.isPending || childCodes.length === 0 || !destOrgId}
        >
          {dispatch.isPending
            ? "Dispatching…"
            : `Dispatch ${childCodes.length} item${childCodes.length === 1 ? "" : "s"}`}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Public panel ─────────────────────────────────────────────────────────────

export function StockTransferPanel({
  receiveOnly = false,
  initialView,
}: {
  receiveOnly?: boolean;
  /** From ?view= — opens Dispatch when the user clicked "Transfer stock". */
  initialView?: string | null;
}) {
  const { data: outgoingData, isLoading: outLoading } = useOutgoingTransfers();
  const { data: incomingData, isLoading: inLoading } = useIncomingTransfers();
  const defaultTab =
    initialView === "dispatch" || initialView === "new"
      ? "new"
      : initialView === "incoming"
        ? "incoming"
        : "outgoing";

  if (receiveOnly) {
    const incoming = incomingData?.content ?? [];
    const awaiting = incoming.filter(
      (t) => t.status === "DISPATCHED" || t.status === "PARTIALLY_RECEIVED",
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle>Incoming transfers</CardTitle>
          <CardDescription>
            Confirm receipts for stock sent to you. Pending items stay in transit until you receive
            them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Loading…
            </div>
          ) : incoming.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <ArrowDownLeft className="size-8 text-border" />
              <p className="text-sm font-medium text-foreground">Nothing to receive</p>
              <p className="text-xs text-muted-foreground">
                When a supplier dispatches stock to you, it will appear here.
              </p>
            </div>
          ) : (
            <>
              {awaiting.length > 0 && (
                <p className="mb-3 text-xs font-medium text-primary">
                  {awaiting.length} transfer{awaiting.length === 1 ? "" : "s"} waiting for receipt
                </p>
              )}
              <DataTable
                columns={incomingColumns}
                data={incoming}
                showFilter={false}
                showPagination={false}
                noBorder
              />
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue={defaultTab} key={defaultTab} className="space-y-4">
      <TabsList className="rounded-xl border border-border/80 bg-muted/50 p-1">
        <TabsTrigger value="outgoing" className="gap-2">
          <ArrowUpRight className="size-4" /> Outgoing
        </TabsTrigger>
        <TabsTrigger value="incoming" className="gap-2">
          <ArrowDownLeft className="size-4" /> Incoming
        </TabsTrigger>
        <TabsTrigger value="new" className="gap-2">
          <Plus className="size-4" /> Dispatch
        </TabsTrigger>
      </TabsList>

      <TabsContent value="outgoing">
        <Card>
          <CardHeader>
            <CardTitle>Outgoing transfers</CardTitle>
            <CardDescription>Stock you have dispatched to other businesses</CardDescription>
          </CardHeader>
          <CardContent>
            {outLoading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                Loading…
              </div>
            ) : (
              <DataTable
                columns={outgoingColumns}
                data={outgoingData?.content ?? []}
                showFilter={false}
                showPagination={false}
                noBorder
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="incoming">
        <Card>
          <CardHeader>
            <CardTitle>Incoming transfers</CardTitle>
            <CardDescription>Stock addressed to your organization</CardDescription>
          </CardHeader>
          <CardContent>
            {inLoading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                Loading…
              </div>
            ) : (
              <DataTable
                columns={incomingColumns}
                data={incomingData?.content ?? []}
                showFilter={false}
                showPagination={false}
                noBorder
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="new">
        <DispatchForm />
      </TabsContent>
    </Tabs>
  );
}
