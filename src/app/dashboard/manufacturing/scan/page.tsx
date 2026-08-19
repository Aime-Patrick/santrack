"use client";

import { useState } from "react";
import { ScanLine, Package, MapPin, Clock, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QrScanInput } from "@/components/ui/qr-scanner";
import { useItem, useLifecycleAction } from "@/hooks/items";
import { useTraceTimeline } from "@/hooks/trace";
import type { LifecycleAction } from "@/services/item.service";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  IN_TRANSIT: "bg-blue-100 text-blue-800",
  SOLD: "bg-purple-100 text-purple-800",
  RETURNED: "bg-orange-100 text-orange-800",
  QUARANTINED: "bg-yellow-100 text-yellow-800",
  RECALLED: "bg-red-100 text-red-800",
  EXPIRED: "bg-gray-100 text-gray-800",
  DAMAGED: "bg-red-100 text-red-800",
  DESTROYED: "bg-gray-100 text-gray-500",
};

export default function ScanPage() {
  const [scanInput, setScanInput] = useState("");
  const [activeCode, setActiveCode] = useState("");
  const [lifecycleReason, setLifecycleReason] = useState("");

  const { data: item, isLoading: itemLoading } = useItem(activeCode);
  const { data: timeline } = useTraceTimeline(activeCode);
  const lifecycleMutation = useLifecycleAction();

  const handleScan = () => {
    const code = scanInput.trim();
    if (code) setActiveCode(code);
  };

  const handleLifecycle = (action: LifecycleAction) => {
    if (!activeCode) return;
    lifecycleMutation.mutate(
      { qrCode: activeCode, action, reason: lifecycleReason || undefined },
      { onSuccess: () => setLifecycleReason("") }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <ScanLine className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scan / Lookup</h1>
          <p className="text-muted-foreground">
            Scan a QR code or enter a code manually to view item details, trace history, and apply lifecycle actions.
          </p>
        </div>
      </div>

      {/* Scanner Input */}
      <Card>
        <CardContent className="pt-6">
          <QrScanInput
            onScan={(code) => setActiveCode(code)}
            placeholder="Scan QR code or enter code manually..."
          />
        </CardContent>
      </Card>

      {activeCode && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Item Details */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
                <CardDescription>
                  {itemLoading ? "Loading..." : item ? `Code: ${item.code}` : "Item not found"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {item ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Kind</p>
                        <Badge variant="outline">{item.kind}</Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Badge className={STATUS_COLORS[item.status] || ""}>{item.status}</Badge>
                      </div>
                      {item.packageType && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Package Type</p>
                          <Badge variant="outline">{item.packageType}</Badge>
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Seal State</p>
                        <Badge variant={item.sealState === "SEALED" ? "default" : "secondary"}>
                          {item.sealState}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2 text-sm">
                      {item.productName && (
                        <div className="flex items-center gap-2">
                          <Package className="size-4 text-muted-foreground" />
                          <span>{item.productName} ({item.productSku})</span>
                        </div>
                      )}
                      {item.batchCode && (
                        <div className="flex items-center gap-2">
                          <Package className="size-4 text-muted-foreground" />
                          <span>Batch: {item.batchCode}</span>
                        </div>
                      )}
                      {item.locationName && (
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4 text-muted-foreground" />
                          <span>{item.locationName}</span>
                        </div>
                      )}
                      {item.holderName && (
                        <div className="flex items-center gap-2">
                          <Shield className="size-4 text-muted-foreground" />
                          <span>Holder: {item.holderName}</span>
                        </div>
                      )}
                      {item.expiresOn && (
                        <div className="flex items-center gap-2">
                          <Clock className="size-4 text-muted-foreground" />
                          <span>
                            Expires: {item.expiresOn}
                            {item.expired && (
                              <Badge variant="destructive" className="ml-2">Expired</Badge>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : !itemLoading ? (
                  <div className="flex h-32 items-center justify-center text-muted-foreground">
                    No item found for this code
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center text-muted-foreground">
                    Loading...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lifecycle Actions */}
            {item && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="size-4" />
                    Lifecycle Actions
                  </CardTitle>
                  <CardDescription>Apply a status change to this item</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Reason (optional)"
                    value={lifecycleReason}
                    onChange={(e) => setLifecycleReason(e.target.value)}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" onClick={() => handleLifecycle("QUARANTINE")} disabled={lifecycleMutation.isPending}>
                      Quarantine
                    </Button>
                    <Button variant="outline" onClick={() => handleLifecycle("RELEASE")} disabled={lifecycleMutation.isPending}>
                      Release
                    </Button>
                    <Button variant="outline" onClick={() => handleLifecycle("RETURN")} disabled={lifecycleMutation.isPending}>
                      Return
                    </Button>
                    <Button variant="outline" onClick={() => handleLifecycle("DAMAGE")} disabled={lifecycleMutation.isPending}>
                      Damage
                    </Button>
                    <Button variant="outline" onClick={() => handleLifecycle("EXPIRE")} disabled={lifecycleMutation.isPending}>
                      Expire
                    </Button>
                    <Button variant="destructive" onClick={() => handleLifecycle("DESTROY")} disabled={lifecycleMutation.isPending}>
                      Destroy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Trace Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Trace Timeline</CardTitle>
              <CardDescription>
                {timeline ? `${timeline.eventCount} event(s) in history` : "Loading trace history..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timeline && timeline.events.length > 0 ? (
                <div className="relative space-y-4">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                  {timeline.events.map((event, idx) => (
                    <div key={idx} className="relative flex gap-3">
                      <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-sm">{event.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.actorName} ({event.actorOrganizationName})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : timeline ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  No events recorded yet
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  Scan an item to view its trace history
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
