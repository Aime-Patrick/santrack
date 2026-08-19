"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrScanInput } from "@/components/ui/qr-scanner";
import { usePackItems, useItem, useItemContents } from "@/hooks/items";

export default function PackItemsPage() {
  const router = useRouter();
  const [containerCode, setContainerCode] = useState("");
  const [childCode, setChildCode] = useState("");
  const [scannedChildren, setScannedChildren] = useState<string[]>([]);

  const { data: container } = useItem(containerCode);
  const { data: contents } = useItemContents(containerCode);
  const packItems = usePackItems();

  const addChild = () => {
    const code = childCode.trim();
    if (code && !scannedChildren.includes(code)) {
      setScannedChildren((prev) => [...prev, code]);
      setChildCode("");
    }
  };

  const removeChild = (code: string) => {
    setScannedChildren((prev) => prev.filter((c) => c !== code));
  };

  const handlePack = () => {
    if (!containerCode || scannedChildren.length === 0) return;
    packItems.mutate(
      { qrCode: containerCode, input: { childQrCodes: scannedChildren } },
      { onSuccess: () => { setScannedChildren([]); } }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <PackageCheck className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pack Items</h1>
          <p className="text-muted-foreground">
            Scan a container QR code, then scan individual items to pack them inside.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Container + Scanner */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Container</CardTitle>
              <CardDescription>Scan or enter the container&apos;s QR code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <QrScanInput
                onScan={(code) => setContainerCode(code)}
                placeholder="Scan container QR code..."
              />
              {container && (
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="font-medium">{container.code}</p>
                  <p className="text-sm text-muted-foreground">
                    Type: <Badge variant="outline">{container.packageType}</Badge>
                    {" · "}Status: <Badge variant={container.sealState === "SEALED" ? "default" : "secondary"}>{container.sealState}</Badge>
                  </p>
                  {container.productName && (
                    <p className="text-sm text-muted-foreground">Product: {container.productName}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scan Items to Pack</CardTitle>
              <CardDescription>Scan each item&apos;s QR code and add it to the list</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <QrScanInput
                onScan={(code) => {
                  if (!scannedChildren.includes(code)) {
                    setScannedChildren((prev) => [...prev, code]);
                  }
                }}
                placeholder="Scan item QR code..."
              />
              <div className="flex flex-wrap gap-2">
                {scannedChildren.map((code) => (
                  <Badge key={code} variant="secondary" className="gap-1 pr-1">
                    {code}
                    <button
                      type="button"
                      onClick={() => removeChild(code)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Button
                className="w-full"
                onClick={handlePack}
                disabled={packItems.isPending || scannedChildren.length === 0 || !containerCode}
              >
                {packItems.isPending
                  ? "Packing..."
                  : `Pack ${scannedChildren.length} Item(s) into Container`}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Current Contents */}
        <Card>
          <CardHeader>
            <CardTitle>Container Contents</CardTitle>
            <CardDescription>
              {contents
                ? `${contents.remainingCount} item(s) inside, ${contents.removedCount} removed`
                : "Enter a container QR code to see contents"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contents && contents.remaining.length > 0 ? (
              <div className="space-y-2">
                {contents.remaining.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border p-2">
                    <div>
                      <p className="font-medium text-sm">{item.code}</p>
                      <p className="text-xs text-muted-foreground">{item.productName || item.productSku}</p>
                    </div>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                ))}
              </div>
            ) : contents ? (
              <p className="text-center text-muted-foreground py-8">Container is empty</p>
            ) : (
              <p className="text-center text-muted-foreground py-8">Scan a container to view contents</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
