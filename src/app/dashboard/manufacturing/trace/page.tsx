"use client";

import { useState } from "react";
import { Search, Clock, Shield, MapPin, Package, Factory, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QrScanInput } from "@/components/ui/qr-scanner";
import { useTraceTimeline } from "@/hooks/trace";

export default function TracePage() {
  const [activeCode, setActiveCode] = useState("");

  const { data: timeline, isLoading } = useTraceTimeline(activeCode);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <Clock className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Traceability</h1>
          <p className="text-muted-foreground">
            View the complete lifecycle history of any traceable item — from manufacture to current state.
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <QrScanInput
            onScan={(code) => setActiveCode(code)}
            placeholder="Scan or enter QR code to trace..."
          />
        </CardContent>
      </Card>

      {activeCode && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Origin Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Origin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {timeline ? (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <Factory className="size-4 text-muted-foreground" />
                      <span>{timeline.origin.manufacturerName || "Unknown manufacturer"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="size-4 text-muted-foreground" />
                      <span>Batch: {timeline.origin.batchCode || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="size-4 text-muted-foreground" />
                      <span>Manufactured: {timeline.origin.manufacturedOn || "N/A"}</span>
                    </div>
                    {timeline.origin.expiresOn && (
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="size-4 text-muted-foreground" />
                        <span>Expires: {timeline.origin.expiresOn}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Current Status</p>
                      <Badge className={timeline.item.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : ""}>
                        {timeline.item.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Code</p>
                      <p className="font-mono text-sm">{timeline.item.code}</p>
                    </div>
                    {timeline.item.locationName && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Location</p>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="size-3" />
                          {timeline.item.locationName}
                        </div>
                      </div>
                    )}
                    {timeline.item.holderName && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Holder</p>
                        <div className="flex items-center gap-1 text-sm">
                          <Shield className="size-3" />
                          {timeline.item.holderName}
                        </div>
                      </div>
                    )}
                  </>
                ) : isLoading ? (
                  <div className="flex h-32 items-center justify-center text-muted-foreground">Loading...</div>
                ) : (
                  <div className="flex h-32 items-center justify-center text-muted-foreground">
                    Enter a code to view trace info
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Lifecycle Timeline</CardTitle>
                <CardDescription>
                  {timeline ? `${timeline.eventCount} event(s) recorded` : "Enter a code to view the timeline"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timeline && timeline.events.length > 0 ? (
                  <div className="relative space-y-6">
                    <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-border" />
                    {timeline.events.map((event, idx) => (
                      <div key={idx} className="relative flex gap-4">
                        <div className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background">
                          <span className="text-xs font-bold text-primary">{idx + 1}</span>
                        </div>
                        <div className="flex-1 space-y-1 rounded-lg border p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm">{event.type}</p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            by {event.actorName} @ {event.actorOrganizationName}
                          </p>
                          {Object.keys(event.details).length > 0 && (
                            <div className="mt-2 rounded bg-muted/50 p-2 text-xs font-mono">
                              {JSON.stringify(event.details, null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : timeline ? (
                  <div className="flex h-32 items-center justify-center text-muted-foreground">
                    No events recorded for this item
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center text-muted-foreground">
                    Enter an item code to view its trace timeline
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
