"use client";

import { Wrench, Shield, Headphones, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/dashboard/stat-card";

const features = [
  {
    icon: <Wrench className="size-5 text-white" />,
    iconBg: "bg-primary",
    title: "Machine Maintenance",
    description: "Track machine status, schedule preventive maintenance, and log repair history.",
    status: "coming-soon",
  },
  {
    icon: <Shield className="size-5 text-white" />,
    iconBg: "bg-success",
    title: "Warranty Tracking",
    description: "Manage product warranties, track activation dates, and process warranty claims.",
    status: "coming-soon",
  },
  {
    icon: <Headphones className="size-5 text-white" />,
    iconBg: "bg-warning-foreground",
    title: "Service Requests",
    description: "Create and manage after-sales service requests, repairs, and replacements.",
    status: "coming-soon",
  },
];

export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <Wrench className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-sm text-muted-foreground">Machine maintenance, warranties, and service requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Machine Maintenance" value="—" icon={<Wrench className="size-4" />} iconBg="bg-primary" caption="Coming Soon" />
        <MetricCard title="Warranty Tracking" value="—" icon={<Shield className="size-4" />} iconBg="bg-success" caption="Coming Soon" />
        <MetricCard title="Service Requests" value="—" icon={<Headphones className="size-4" />} iconBg="bg-warning-foreground" caption="Coming Soon" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>These features are under development and will be available in a future release.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="flex flex-col gap-3 rounded-lg border border-border/60 p-4">
                <div className="flex items-center gap-2.5">
                  <div className={`flex size-8 items-center justify-center rounded-lg ${f.iconBg}`}>
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{f.title}</p>
                    <Badge variant="outline" className="mt-0.5 border-warning/30 bg-warning/10 text-warning-foreground">
                      <Clock className="size-3" /> Coming Soon
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
