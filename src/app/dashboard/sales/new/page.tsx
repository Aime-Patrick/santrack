"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2, Building2, User, CheckCircle2, AlertTriangle, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QrScanInput } from "@/components/ui/qr-scanner";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useItem } from "@/hooks/items";
import { useSell } from "@/hooks/sales";
import { useOrganizations } from "@/hooks/organizations";
import type { SaleType } from "@/services/sale.service";

interface ScannedEntry {
  qrCode: string;
  code: string;
  productName: string | null;
  productSku: string | null;
  batchCode: string | null;
  status: string;
}

export default function NewSalePage() {
  const router = useRouter();
  const [saleType, setSaleType] = useState<SaleType>("CONSUMER");
  const [pendingCode, setPendingCode] = useState("");
  const [scannedItems, setScannedItems] = useState<ScannedEntry[]>([]);
  const [buyerOrgId, setBuyerOrgId] = useState("");
  const [consumerRef, setConsumerRef] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const addedRef = useRef(new Set<string>());

  const { data: scanResult, isLoading: scanning } = useItem(pendingCode.trim());
  const sell = useSell();
  const { data: orgs } = useOrganizations();

  // Auto-add item when scan resolves
  useEffect(() => {
    if (!scanResult || !pendingCode) return;
    if (addedRef.current.has(scanResult.qrCode)) return;
    if (scannedItems.some((i) => i.qrCode === scanResult.qrCode)) {
      addedRef.current.add(scanResult.qrCode);
      return;
    }

    addedRef.current.add(scanResult.qrCode);
    setScannedItems((prev) => [
      ...prev,
      {
        qrCode: scanResult.qrCode,
        code: scanResult.code,
        productName: scanResult.productName,
        productSku: scanResult.productSku,
        batchCode: scanResult.batchCode,
        status: scanResult.status,
      },
    ]);
    setLastAdded(scanResult.productName || scanResult.code);
    setTimeout(() => setLastAdded(null), 2000);
    setPendingCode("");
  }, [scanResult, pendingCode, scannedItems]);

  const removeItem = (qrCode: string) => {
    addedRef.current.delete(qrCode);
    setScannedItems((prev) => prev.filter((i) => i.qrCode !== qrCode));
  };

  const handleSubmit = () => {
    if (scannedItems.length === 0) return;
    if (saleType === "BUSINESS" && !buyerOrgId) return;

    sell.mutate(
      {
        type: saleType,
        itemQrCodes: scannedItems.map((i) => i.qrCode),
        buyerOrganizationId: saleType === "BUSINESS" ? Number(buyerOrgId) : undefined,
        consumerRef: saleType === "CONSUMER" ? consumerRef || undefined : undefined,
        totalAmount: totalAmount || undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          router.push("/dashboard/sales");
        },
      }
    );
  };

  const isSellable = (status: string) => status === "ACTIVE";

  const canSubmit =
    scannedItems.length > 0 &&
    scannedItems.every((i) => isSellable(i.status)) &&
    (saleType === "CONSUMER" || buyerOrgId) &&
    !sell.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <ShoppingCart className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">New Sale</h1>
          <p className="text-sm text-muted-foreground">
            Scan items to add them to the sale, choose sale type, and complete the transaction.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Scanner + Sale Type */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sale Type</CardTitle>
              <CardDescription>Business sales trigger a dispatch; consumer sales end the chain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSaleType("CONSUMER")}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                    saleType === "CONSUMER"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <User className="size-5 text-primary" />
                  <div>
                    <p className="font-medium">Consumer</p>
                    <p className="text-xs text-muted-foreground">End consumer sale</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSaleType("BUSINESS")}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                    saleType === "BUSINESS"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Building2 className="size-5 text-primary" />
                  <div>
                    <p className="font-medium">Business</p>
                    <p className="text-xs text-muted-foreground">Sale to another org</p>
                  </div>
                </button>
              </div>

              {saleType === "BUSINESS" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buyer Organization</label>
                  <SearchableSelect
                    value={buyerOrgId}
                    onValueChange={setBuyerOrgId}
                    placeholder="Select buyer..."
                    searchPlaceholder="Search businesses by name, type…"
                    items={(orgs ?? [])
                      .filter((o) => o.type !== "REGULATOR" && o.type !== "CONSUMER")
                      .map((org) => ({
                        value: String(org.id),
                        label: org.name,
                        badge: org.type,
                      }))}
                  />
                </div>
              )}

              {saleType === "CONSUMER" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Consumer Reference (optional)</label>
                  <Input
                    placeholder="Phone, receipt number, or token..."
                    value={consumerRef}
                    onChange={(e) => setConsumerRef(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scan Items</CardTitle>
              <CardDescription>Scan each item&apos;s QR code — items are added automatically</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <QrScanInput
                onScan={(code) => {
                  if (!scannedItems.some((i) => i.qrCode === code) && !addedRef.current.has(code)) {
                    setPendingCode(code);
                  }
                }}
                placeholder="Scan item QR code or barcode..."
              />

              {scanning && pendingCode && (
                <div className="flex items-center gap-2 rounded-lg border bg-primary/5 px-3 py-2 text-sm">
                  <ScanLine className="size-4 text-primary animate-pulse" />
                  <span>Looking up <span className="font-mono">{pendingCode}</span>...</span>
                </div>
              )}

              {lastAdded && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                  <CheckCircle2 className="size-4" />
                  Added: <span className="font-medium">{lastAdded}</span>
                </div>
              )}

              {scannedItems.length > 0 && <Separator />}

              <div className="space-y-2">
                {scannedItems.map((item) => (
                  <div key={item.qrCode} className="flex items-center justify-between rounded-lg border p-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{item.productName || item.code}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSellable(item.status) ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800">Sellable</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 text-red-800">{item.status}</Badge>
                      )}
                      <button
                        type="button"
                        onClick={() => removeItem(item.qrCode)}
                        className="rounded-full p-1 hover:bg-muted"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary + Submit */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sale Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <Badge variant={saleType === "CONSUMER" ? "secondary" : "default"}>
                  {saleType === "CONSUMER" ? "Consumer" : "Business"}
                </Badge>
              </div>

              {saleType === "BUSINESS" && buyerOrgId && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Buyer</span>
                  <span className="font-medium">
                    {orgs?.find((o) => String(o.id) === buyerOrgId)?.name || buyerOrgId}
                  </span>
                </div>
              )}

              {saleType === "CONSUMER" && consumerRef && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Consumer Ref</span>
                  <span className="font-mono text-xs">{consumerRef}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-sm font-medium">
                <span>Items Count</span>
                <span>{scannedItems.length}</span>
              </div>

              {scannedItems.some((i) => !isSellable(i.status)) && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                  <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                  <span>Some items are not sellable (must be ACTIVE). Remove them to proceed.</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Total Amount (optional)</label>
                <Input
                  placeholder="e.g. 150000"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Input
                  placeholder="Invoice number, payment terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full"
              >
                {sell.isPending ? "Recording Sale..." : `Complete Sale (${scannedItems.length} items)`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
