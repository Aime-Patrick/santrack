"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Receipt,
  ScanLine,
  Trash2,
  ShoppingCart,
  CheckCircle,
  Loader2,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QrScanInput } from "@/components/ui/qr-scanner";
import { ScanTargetHint } from "@/components/trace/scan-target-hint";
import { useResolveCode } from "@/hooks/scan";
import { useSell } from "@/hooks/sales";

interface CartLine {
  qrCode: string;
  code: string;
  productName: string;
  sku: string | null;
  batchCode: string | null;
  itemKind: "UNIT" | "PACKAGE";
  packageType: string | null;
}

function CartLineRow({
  line,
  onRemove,
}: {
  line: CartLine;
  onRemove: (qrCode: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 py-2.5 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{line.productName}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[13px] text-muted-foreground">{line.code}</span>
          <Badge variant="outline" className="h-4 px-1.5 py-0 text-[10px]">
            {line.itemKind === "PACKAGE"
              ? `Whole ${(line.packageType ?? "package").toLowerCase()}`
              : "Unit"}
          </Badge>
          {line.batchCode && (
            <Badge variant="outline" className="h-4 px-1.5 py-0 text-[10px]">
              {line.batchCode}
            </Badge>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(line.qrCode)}
        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
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

    if (cart.some((l) => l.qrCode === code.trim() || l.code === code.trim())) {
      toast.warning("Item already in cart");
      return;
    }

    resolve.mutate(code.trim(), {
      onSuccess(result) {
        if (result.kind !== "ITEM" || !result.itemQrCode) {
          toast.error("That code is not sellable stock. Scan a unit on the bottle, or a sealed box/pallet.");
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
            itemKind: result.itemKind ?? "UNIT",
            packageType: result.packageType ?? null,
          },
        ]);
        setLastSale(null);
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
      },
    );
  }

  const isProcessing = resolve.isPending || sell.isPending;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-success text-white">
            <Receipt className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Point of sale</h1>
            <p className="text-sm text-muted-foreground">
              Scan items into the cart, then confirm. Stock leaves inventory immediately.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/dashboard/sales?tab=sales" />}
        >
          <History className="mr-1.5 size-4" /> Sales history
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ScanLine className="size-4 text-primary" />
                Scan to sell
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScanTargetHint expect="either" />
              <p className="text-xs text-muted-foreground">
                Bottle QR = one unit. Box/pallet QR = sell the whole sealed package (and everything inside it).
              </p>
              <QrScanInput
                onScan={handleScan}
                placeholder="Scan unit or sealed package QR…"
                scanning="a unit or a sealed package"
              />
              {resolve.isPending && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Resolving code…
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShoppingCart className="size-4 text-primary" />
                  Cart
                  {cart.length > 0 && (
                    <Badge className="ml-1 h-5 bg-primary px-1.5 py-0 text-[13px] text-white">
                      {cart.length}
                    </Badge>
                  )}
                </CardTitle>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs text-muted-foreground transition-colors hover:text-danger"
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
                  <p className="text-xs text-faint">Scan a bottle, or a sealed box/pallet to sell the whole pack</p>
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

        <div className="space-y-4 lg:col-span-2">
          {lastSale && (
            <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
              <CheckCircle className="mt-0.5 size-5 shrink-0 text-success" />
              <div>
                <p className="text-sm font-bold text-success">Sale recorded</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Ref:{" "}
                  <span className="font-mono font-semibold">{lastSale.reference}</span> —{" "}
                  {lastSale.count} item{lastSale.count !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Checkout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="font-semibold">{cart.length}</span>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Customer ref (optional)
                </label>
                <input
                  type="text"
                  value={consumerRef}
                  onChange={(e) => setConsumerRef(e.target.value)}
                  placeholder="Phone, name, or ID…"
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <Button
                className="w-full bg-success font-bold text-white hover:bg-success/90"
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
