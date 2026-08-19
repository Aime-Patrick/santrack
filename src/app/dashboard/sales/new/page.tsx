"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Plus, Trash2, Building2, User, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QrScanInput } from "@/components/ui/qr-scanner";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
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
  const [scanInput, setScanInput] = useState("");
  const [scannedItems, setScannedItems] = useState<ScannedEntry[]>([]);
  const [buyerOrgId, setBuyerOrgId] = useState("");
  const [consumerRef, setConsumerRef] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");

  const { data: scanResult } = useItem(scanInput.trim());
  const sell = useSell();
  const { data: orgs } = useOrganizations();

  const addItem = () => {
    const code = scanInput.trim();
    if (!code || scannedItems.some((i) => i.qrCode === code)) {
      setScanInput("");
      return;
    }

    if (scanResult) {
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
    }
    setScanInput("");
  };

  const removeItem = (qrCode: string) => {
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
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <ShoppingCart className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Sale</h1>
          <p className="text-muted-foreground">
            Scan item QR codes, choose sale type, and complete the transaction.
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
                  <Select value={buyerOrgId} onValueChange={(v) => setBuyerOrgId(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select buyer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(orgs ?? []).map((org) => (
                        <SelectItem key={org.id} value={String(org.id)}>
                          {org.name} ({org.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <CardDescription>Scan each item&apos;s QR code to add it to the sale</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <QrScanInput
                onScan={(code) => {
                  if (!scannedItems.some((i) => i.qrCode === code)) {
                    setScanInput(code);
                  }
                }}
                placeholder="Scan item QR code..."
              />

              {scanResult && !scannedItems.some((i) => i.qrCode === scanResult.qrCode) && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1">
                  <p className="font-medium text-sm">{scanResult.productName || scanResult.code}</p>
                  <p className="text-xs text-muted-foreground">
                    SKU: {scanResult.productSku || "\u2014"} | Batch: {scanResult.batchCode || "\u2014"} | Status: {scanResult.status}
                  </p>
                </div>
              )}

              {scannedItems.length > 0 && <Separator />}

              <div className="space-y-2">
                {scannedItems.map((item) => (
                  <div key={item.qrCode} className="flex items-center justify-between rounded-lg border p-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{item.productName || item.code}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.qrCode}</p>
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
              <CardDescription>Review and complete the transaction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sale Type</span>
                  <Badge variant="outline">{saleType}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{scannedItems.length}</span>
                </div>
                {scannedItems.some((i) => !isSellable(i.status)) && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2 text-sm text-red-800">
                    <AlertTriangle className="size-4" />
                    Some items are not sellable
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium">Total Amount (optional)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Input
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {sell.isPending ? (
                  "Processing Sale..."
                ) : sell.isError ? (
                  "Sale Failed - Try Again"
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 size-4" />
                    Complete Sale
                  </>
                )}
              </Button>

              {sell.isError && (
                <p className="text-sm text-destructive text-center">
                  {sell.error instanceof Error ? sell.error.message : "Sale failed"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
