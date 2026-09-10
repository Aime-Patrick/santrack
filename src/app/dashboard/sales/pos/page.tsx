"use client";

import { useState } from "react";
import {
  Receipt,
  ScanLine,
  Trash2,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QrScanInput } from "@/components/ui/qr-scanner";
import { useResolveCode } from "@/hooks/scan";
import { useSell } from "@/hooks/sales";
import { cn } from "@/lib/utils";

interface CartLine {
  qrCode: string;
  code: string;
  productName: string;
  sku: string | null;
  batchCode: string | null;
}

function CartLineRow({
  line,
  onRemove,
}: {
  line: CartLine;
  onRemove: (qrCode: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">{line.productName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted-foreground font-mono">{line.code}</span>
          {line.batchCode && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {line.batchCode}
            </Badge>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(line.qrCode)}
        className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors shrink-0"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

export default function POSPage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [consumerRef, setConsumerRef] = useState("");
  const [lastSale, setLastSale] = useState<{ reference: string; count: number } | null>(null);

  const resolve = useResolveCode();
  const sell = useSell();

  function handleScan(code: string) {
    if (!code.trim()) return;

    // Prevent duplicates
    if (cart.some((l) => l.qrCode === code.trim() || l.code === code.trim())) {
      toast.warning("Item already in cart");
      return;
    }

    resolve.mutate(code.trim(), {
      onSuccess(result) {
        if (result.kind !== "ITEM" || !result.itemQrCode) {
          toast.error("Scanned code is not a sellable item");
          return;
        }
        setCart((prev) => [
          ...prev,
          {
            qrCode: result.itemQrCode!,
            code: result.scanned,
            productName: result.describes,
            sku: result.carried?.gtin ?? null,
            batchCode: result.carried?.batchCode ?? null,
          },
        ]);
      },
      onError() {
        toast.error("Code not recognised — check it and try again");
      },
    });
  }

  function removeFromCart(qrCode: string) {
    setCart((prev) => prev.filter((l) => l.qrCode !== qrCode));
  }

  function clearCart() {
    setCart([]);
    setConsumerRef("");
    setLastSale(null);
  }

  function checkout() {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    sell.mutate(
      {
        type: "CONSUMER",
        consumerRef: consumerRef.trim() || undefined,
        itemQrCodes: cart.map((l) => l.qrCode),
      },
      {
        onSuccess(data) {
          setLastSale({ reference: data.sale.reference, count: cart.length });
          setCart([]);
          setConsumerRef("");
          toast.success(`Sale ${data.sale.reference} recorded`);
        },
        onError() {
          toast.error("Sale failed — check item statuses and try again");
        },
      }
    );
  }

  const isProcessing = resolve.isPending || sell.isPending;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-success text-white">
          <Receipt className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Point of Sale</h1>
          <p className="text-sm text-muted-foreground">
            Scan items to add them to the cart, then confirm the sale.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* ── Left: Scanner + Cart ── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Scanner */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ScanLine className="size-4 text-primary" />
                Scan item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QrScanInput
                onScan={handleScan}
                placeholder="Scan QR code or barcode…"
              />
              {resolve.isPending && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Resolving code…
                </p>
              )}
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShoppingCart className="size-4 text-primary" />
                  Cart
                  {cart.length > 0 && (
                    <Badge className="ml-1 bg-primary text-white text-[11px] px-1.5 py-0 h-5">
                      {cart.length}
                    </Badge>
                  )}
                </CardTitle>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs text-muted-foreground hover:text-danger transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="py-10 text-center">
                  <ShoppingCart className="mx-auto size-10 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">No items scanned yet</p>
                  <p className="text-xs text-muted-foreground/70">Scan a QR code above to start</p>
                </div>
              ) : (
                <div>
                  {cart.map((line) => (
                    <CartLineRow key={line.qrCode} line={line} onRemove={removeFromCart} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Summary + Checkout ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Success notice */}
          {lastSale && (
            <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/8 p-4">
              <CheckCircle className="size-5 text-success shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-success">Sale recorded</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ref: <span className="font-mono font-semibold">{lastSale.reference}</span> — {lastSale.count} item{lastSale.count !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}

          {/* Order summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="font-semibold">{cart.length}</span>
              </div>
              <Separator />
              {/* Optional consumer ref */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Customer ref (optional)
                </label>
                <input
                  type="text"
                  value={consumerRef}
                  onChange={(e) => setConsumerRef(e.target.value)}
                  placeholder="Phone, name, or ID…"
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
              </div>
              <Button
                className="w-full bg-success hover:bg-success/90 text-white font-bold"
                onClick={checkout}
                disabled={cart.length === 0 || isProcessing}
              >
                {sell.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 size-4" />
                    Confirm sale ({cart.length} item{cart.length !== 1 ? "s" : ""})
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
