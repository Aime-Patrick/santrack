"use client";

import { useState } from "react";
import { ArrowRightLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrScanInput } from "@/components/ui/qr-scanner";
import { useRelocate } from "@/hooks/transfers";
import { useLocations } from "@/hooks/locations";

export default function StockRelocatePage() {
  const [destinationLocationId, setDestinationLocationId] = useState<string>("");
  const [scanInput, setScanInput] = useState("");
  const [scannedCodes, setScannedCodes] = useState<string[]>([]);

  const { data: locations } = useLocations();
  const relocate = useRelocate();

  const addCode = () => {
    const code = scanInput.trim();
    if (code && !scannedCodes.includes(code)) {
      setScannedCodes((prev) => [...prev, code]);
      setScanInput("");
    }
  };

  const removeCode = (code: string) => {
    setScannedCodes((prev) => prev.filter((c) => c !== code));
  };

  const handleRelocate = () => {
    if (!destinationLocationId || scannedCodes.length === 0) return;
    relocate.mutate(
      { itemQrCodes: scannedCodes, destinationLocationId: Number(destinationLocationId) },
      { onSuccess: () => { setScannedCodes([]); setDestinationLocationId(""); } }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <ArrowRightLeft className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Relocate</h1>
          <p className="text-muted-foreground">
            Move items between your organization&apos;s own locations (e.g. Warehouse A → Warehouse B).
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relocate Items</CardTitle>
          <CardDescription>Select destination and scan items to move</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">Destination Location *</p>
            <Select onValueChange={(v) => setDestinationLocationId(v ?? "")} value={destinationLocationId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {locations?.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.name} ({l.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Items to Relocate</p>
            <QrScanInput
              onScan={(code) => {
                if (!scannedCodes.includes(code)) {
                  setScannedCodes((prev) => [...prev, code]);
                }
              }}
              placeholder="Scan item QR code..."
            />
            <div className="flex flex-wrap gap-2">
              {scannedCodes.map((code) => (
                <Badge key={code} variant="secondary" className="gap-1 pr-1">
                  {code}
                  <button
                    type="button"
                    onClick={() => removeCode(code)}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Button
            onClick={handleRelocate}
            disabled={relocate.isPending || !destinationLocationId || scannedCodes.length === 0}
          >
            {relocate.isPending
              ? "Relocating..."
              : `Relocate ${scannedCodes.length} Item(s)`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
