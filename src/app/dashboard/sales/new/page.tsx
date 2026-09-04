"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ScanLine,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { QrScanInput } from "@/components/ui/qr-scanner";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useItem } from "@/hooks/items";
import { useSell } from "@/hooks/sales";
import { useCreateCustomer, useCustomers } from "@/hooks/commerce";
import { getApiErrorMessage } from "@/lib/api";
import type { SaleType } from "@/services/sale.service";

interface ScannedEntry {
  qrCode: string;
  code: string;
  productName: string | null;
  productSku: string | null;
  batchCode: string | null;
  status: string;
  quantity: number;
  kind: string | null;
  packageType: string | null;
}

/**
 * New sale — scan each bottle/carton QR into the cart.
 * Product, piece vs package, and unit counts come from the identity.
 */
export default function NewSalePage() {
  const router = useRouter();
  const [saleType, setSaleType] = useState<SaleType>("BUSINESS");
  const [pendingCode, setPendingCode] = useState("");
  const [scanFeedback, setScanFeedback] = useState<{
    tone: "ok" | "warn" | "error";
    message: string;
  } | null>(null);
  const [scannedItems, setScannedItems] = useState<ScannedEntry[]>([]);
  const [buyerOrgId, setBuyerOrgId] = useState("");
  const [consumerRef, setConsumerRef] = useState("");
  const [selectedConsumerId, setSelectedConsumerId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [showQuickConsumer, setShowQuickConsumer] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const addedRef = useRef(new Set<string>());

  const {
    data: scanResult,
    isLoading: scanning,
    isError: scanLookupFailed,
    error: scanLookupError,
  } = useItem(pendingCode.trim());
  const sell = useSell();
  const createCustomer = useCreateCustomer();
  const { data: customerData } = useCustomers();

  const businessCustomers = useMemo(
    () =>
      (customerData?.content ?? []).filter(
        (c) => c.active && c.buyerOrganizationId != null,
      ),
    [customerData],
  );

  const consumerCustomers = useMemo(
    () =>
      (customerData?.content ?? []).filter(
        (c) => c.active && c.type === "CONSUMER",
      ),
    [customerData],
  );

  useEffect(() => {
    if (saleType === "CONSUMER") {
      setBuyerOrgId("");
    } else {
      setSelectedConsumerId("");
      setShowQuickConsumer(false);
    }
  }, [saleType]);

  useEffect(() => {
    if (!pendingCode) return;

    if (scanLookupFailed) {
      setScanFeedback({
        tone: "error",
        message: getApiErrorMessage(
          scanLookupError,
          "Not a sellable item QR. Use a pool identity QR (UUID) or serial ST-… — not the product SKU from the product page.",
        ),
      });
      setPendingCode("");
      return;
    }

    if (!scanResult) return;

    if (
      addedRef.current.has(scanResult.qrCode) ||
      scannedItems.some((i) => i.qrCode === scanResult.qrCode)
    ) {
      addedRef.current.add(scanResult.qrCode);
      setScanFeedback({
        tone: "warn",
        message: `Already in cart: ${scanResult.productName || scanResult.code}`,
      });
      setPendingCode("");
      return;
    }

    if (scanResult.status !== "ACTIVE") {
      setScanFeedback({
        tone: "error",
        message: `${scanResult.code} is not ACTIVE stock (${scanResult.status}). Confirm production or opening stock before selling.`,
      });
      setPendingCode("");
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
        quantity: scanResult.quantity,
        kind: scanResult.kind ?? null,
        packageType: scanResult.packageType ?? null,
      },
    ]);
    const packLabel =
      scanResult.packageType ||
      (scanResult.kind === "PACKAGE" ? "package" : "piece");
    setScanFeedback({
      tone: "ok",
      message: `Added ${scanResult.productName || scanResult.code} · ${packLabel} · ${scanResult.quantity} unit${scanResult.quantity === 1 ? "" : "s"}`,
    });
    setPendingCode("");
  }, [scanResult, pendingCode, scannedItems, scanLookupFailed, scanLookupError]);

  useEffect(() => {
    if (!scanFeedback) return;
    const t = setTimeout(() => setScanFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [scanFeedback]);

  const removeItem = (qrCode: string) => {
    addedRef.current.delete(qrCode);
    setScannedItems((prev) => prev.filter((i) => i.qrCode !== qrCode));
  };

  const clearCart = () => {
    addedRef.current.clear();
    setScannedItems([]);
  };

  const scannedUnits = scannedItems.reduce(
    (sum, i) => sum + (i.quantity || 1),
    0,
  );

  const cartByProduct = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        identities: number;
        productUnits: number;
        packages: number;
        pieces: number;
        packageTypes: Set<string>;
      }
    >();

    for (const item of scannedItems) {
      const key = item.productSku || item.productName || item.code;
      const row = map.get(key) ?? {
        name: item.productName || item.code,
        identities: 0,
        productUnits: 0,
        packages: 0,
        pieces: 0,
        packageTypes: new Set<string>(),
      };
      row.identities += 1;
      row.productUnits += item.quantity || 1;
      if (item.kind === "PACKAGE" || item.packageType) {
        row.packages += 1;
        if (item.packageType) row.packageTypes.add(item.packageType);
      } else {
        row.pieces += 1;
      }
      map.set(key, row);
    }

    return [...map.values()];
  }, [scannedItems]);

  const handleSubmit = () => {
    if (saleType === "BUSINESS" && !buyerOrgId) return;
    if (saleType === "CONSUMER" && !consumerRef.trim()) return;
    if (scannedItems.length === 0) return;

    sell.mutate(
      {
        type: saleType,
        buyerOrganizationId:
          saleType === "BUSINESS" ? Number(buyerOrgId) : undefined,
        consumerRef:
          saleType === "CONSUMER" ? consumerRef.trim() || undefined : undefined,
        totalAmount: totalAmount || undefined,
        notes: notes || undefined,
        itemQrCodes: scannedItems.map((i) => i.qrCode),
      },
      {
        onSuccess: () => router.push("/dashboard/sales"),
      },
    );
  };

  const isSellable = (status: string) => status === "ACTIVE";

  const canSubmit =
    scannedItems.length > 0 &&
    scannedItems.every((i) => isSellable(i.status)) &&
    (saleType === "CONSUMER" ? !!consumerRef.trim() : !!buyerOrgId) &&
    !sell.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <ShoppingCart className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">New Sale</h1>
            <p className="text-sm text-muted-foreground">
              Scan each bottle or carton QR — the cart totals pieces and
              packages for you.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/dashboard/sales?tab=orders" />}
        >
          Need a quote or invoice? Use Orders
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sale type</CardTitle>
              <CardDescription>
                Business sales dispatch to another organization; consumer sales
                end the chain.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSaleType("BUSINESS")}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                    saleType === "BUSINESS"
                      ? "border-primary bg-primary-light"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Building2 className="size-5 text-primary" />
                  <div>
                    <p className="font-medium">Business / org</p>
                    <p className="text-xs text-muted-foreground">Scan to cart</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSaleType("CONSUMER")}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                    saleType === "CONSUMER"
                      ? "border-primary bg-primary-light"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <User className="size-5 text-primary" />
                  <div>
                    <p className="font-medium">Consumer</p>
                    <p className="text-xs text-muted-foreground">Scan to cart</p>
                  </div>
                </button>
              </div>

              {saleType === "BUSINESS" ? (
                <div className="space-y-2">
                  <Label>Buyer (their company on SANTRACK)</Label>
                  <SearchableSelect
                    value={buyerOrgId}
                    onValueChange={setBuyerOrgId}
                    placeholder="Select their company account…"
                    searchPlaceholder="Search by company name…"
                    items={businessCustomers.map((c) => ({
                      value: String(c.buyerOrganizationId),
                      label: c.name,
                      badge: c.code,
                    }))}
                    allowClear
                  />
                  {businessCustomers.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No linked companies yet.{" "}
                      <Link
                        href="/dashboard/sales/customers"
                        className="text-primary underline"
                      >
                        Add a business customer
                      </Link>{" "}
                      with a SANTRACK company.
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Consumer</Label>
                    <SearchableSelect
                      value={selectedConsumerId}
                      onValueChange={(id) => {
                        setSelectedConsumerId(id);
                        const c = consumerCustomers.find(
                          (x) => String(x.id) === id,
                        );
                        if (!c) {
                          setConsumerRef("");
                          return;
                        }
                        setConsumerRef(c.phone?.trim() || c.name || c.code);
                        setShowQuickConsumer(false);
                      }}
                      placeholder="Pick a saved consumer…"
                      searchPlaceholder="Search consumers…"
                      items={consumerCustomers.map((c) => ({
                        value: String(c.id),
                        label: c.name,
                        sublabel: c.phone || undefined,
                        badge: c.code,
                      }))}
                      emptyMessage="No saved consumers yet."
                      allowClear
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Or enter reference</Label>
                    <Input
                      placeholder="Phone, receipt number, or name…"
                      value={consumerRef}
                      onChange={(e) => {
                        setConsumerRef(e.target.value);
                        setSelectedConsumerId("");
                      }}
                    />
                  </div>

                  {selectedConsumerId ? (
                    <p className="text-xs text-muted-foreground">
                      Clear the selection above to save a new consumer here.
                    </p>
                  ) : !showQuickConsumer ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQuickConsumer(true)}
                    >
                      <User className="mr-1.5 size-3.5" />
                      Save new consumer here
                    </Button>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-border/80 bg-muted/30 p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Add to your customer list without leaving this page
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          placeholder="Name *"
                          value={quickName}
                          onChange={(e) => setQuickName(e.target.value)}
                        />
                        <Input
                          placeholder="Phone *"
                          value={quickPhone}
                          onChange={(e) => setQuickPhone(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={
                            !quickName.trim() ||
                            !quickPhone.trim() ||
                            createCustomer.isPending
                          }
                          onClick={() => {
                            const name = quickName.trim();
                            const phone = quickPhone.trim();
                            createCustomer.mutate(
                              {
                                name,
                                type: "CONSUMER",
                                phone,
                              },
                              {
                                onSuccess: (created) => {
                                  setConsumerRef(phone);
                                  setSelectedConsumerId(
                                    created?.id ? String(created.id) : "",
                                  );
                                  setQuickName("");
                                  setQuickPhone("");
                                  setShowQuickConsumer(false);
                                },
                              },
                            );
                          }}
                        >
                          {createCustomer.isPending ? "Saving…" : "Save & use"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowQuickConsumer(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Scan into cart</CardTitle>
              <CardDescription>
                Point at the bottle or carton QR. Product and units come from
                the scan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <QrScanInput
                onScan={(code) => {
                  setScanFeedback(null);
                  if (
                    scannedItems.some((i) => i.qrCode === code) ||
                    addedRef.current.has(code)
                  ) {
                    setScanFeedback({
                      tone: "warn",
                      message: "Already in cart.",
                    });
                    return;
                  }
                  setPendingCode(code);
                }}
                placeholder="Scan item or package QR…"
              />
              {scanning && pendingCode ? (
                <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary-light px-3 py-2 text-sm text-foreground">
                  <ScanLine className="size-4 animate-pulse text-primary" />
                  Looking up <span className="font-mono">{pendingCode}</span>…
                </div>
              ) : null}
              {scanFeedback ? (
                <div
                  className={
                    scanFeedback.tone === "ok"
                      ? "flex items-center gap-2 rounded-lg bg-success px-3 py-2 text-sm text-success-foreground"
                      : scanFeedback.tone === "warn"
                        ? "flex items-center gap-2 rounded-lg border border-warning/40 bg-amber-50 px-3 py-2 text-sm text-foreground"
                        : "flex items-center gap-2 rounded-lg border border-danger/40 bg-red-50 px-3 py-2 text-sm text-danger"
                  }
                >
                  {scanFeedback.tone === "ok" ? (
                    <CheckCircle2 className="size-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="size-4 shrink-0" />
                  )}
                  <span>{scanFeedback.message}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle>Cart</CardTitle>
                <CardDescription>
                  {scannedItems.length === 0
                    ? "Nothing scanned yet"
                    : `${scannedItems.length} item${scannedItems.length === 1 ? "" : "s"} · ${scannedUnits} unit${scannedUnits === 1 ? "" : "s"}`}
                </CardDescription>
              </div>
              {scannedItems.length > 0 ? (
                <Button type="button" variant="ghost" size="sm" onClick={clearCart}>
                  Clear
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <Badge
                  variant={saleType === "CONSUMER" ? "secondary" : "default"}
                >
                  {saleType === "CONSUMER" ? "Consumer" : "Business"}
                </Badge>
              </div>

              {scannedItems.length === 0 ? (
                <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                  Scan goods on the left — they appear here with piece / package
                  totals.
                </div>
              ) : (
                <>
                  <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Totals by product
                    </p>
                    {cartByProduct.map((row) => {
                      const packLabel =
                        row.packageTypes.size > 0
                          ? [...row.packageTypes].join("/")
                          : "package";
                      const parts: string[] = [];
                      if (row.packages > 0) {
                        parts.push(
                          `${row.packages} ${packLabel}${row.packages === 1 ? "" : "s"}`,
                        );
                      }
                      if (row.pieces > 0) {
                        parts.push(
                          `${row.pieces} piece${row.pieces === 1 ? "" : "s"}`,
                        );
                      }
                      parts.push(
                        `${row.productUnits} unit${row.productUnits === 1 ? "" : "s"}`,
                      );
                      return (
                        <div
                          key={row.name}
                          className="flex justify-between gap-3 text-sm"
                        >
                          <span className="truncate font-medium">{row.name}</span>
                          <span className="shrink-0 text-muted-foreground tabular-nums">
                            {parts.join(" · ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Line items
                    </p>
                    {scannedItems.map((item) => (
                      <div
                        key={item.qrCode}
                        className="flex items-center justify-between rounded-lg border p-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.productName || item.code}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {item.code}
                            {item.packageType
                              ? ` · ${item.packageType}`
                              : item.kind === "PACKAGE"
                                ? " · package"
                                : " · piece"}
                            {` · ${item.quantity} unit${item.quantity === 1 ? "" : "s"}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSellable(item.status) ? (
                            <Badge
                              variant="outline"
                              className="border-transparent bg-success text-white"
                            >
                              Sellable
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-transparent bg-danger text-white"
                            >
                              {item.status}
                            </Badge>
                          )}
                          <button
                            type="button"
                            onClick={() => removeItem(item.qrCode)}
                            className="rounded-full p-1 hover:bg-muted"
                            aria-label="Remove from cart"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!canSubmit && scannedItems.some((i) => !isSellable(i.status)) ? (
                <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-red-50 px-3 py-2 text-sm text-danger">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  Remove non-sellable items before completing.
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Total amount (optional)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="RWF"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Delivery note, PO ref…"
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                {sell.isPending ? "Recording…" : "Complete sale"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
