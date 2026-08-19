"use client";

import { Wrench, Shield, Headphones, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: <Wrench className="size-5 text-primary" />,
    title: "Machine Maintenance",
    description: "Track machine status, schedule preventive maintenance, and log repair history.",
    status: "partial" as const,
    note: "Machine status tracking available. Scheduling and history coming soon.",
  },
  {
    icon: <Shield className="size-5 text-primary" />,
    title: "Warranty Tracking",
    description: "Manage product warranties, track activation dates, and process warranty claims.",
    status: "planned" as const,
    note: "Requires warranty entity and service module.",
  },
  {
    icon: <Headphones className="size-5 text-primary" />,
    title: "Service Requests",
    description: "Create and manage after-sales service requests, repairs, and replacements.",
    status: "planned" as const,
    note: "Requires service request entity and workflow.",
  },
];

const statusConfig = {
  partial: { label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
  planned: { label: "Planned", color: "bg-gray-100 text-gray-600" },
};

export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
        <p className="text-muted-foreground">
          After-sales maintenance, warranty tracking, and service request management.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  {f.icon}
                </div>
                <Badge variant="outline" className={statusConfig[f.status].color}>
                  {statusConfig[f.status].label}
                </Badge>
              </div>
              <CardTitle className="mt-3">{f.title}</CardTitle>
              <CardDescription>{f.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {f.note}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
