"use client";

import { AlertTriangle, Bell, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const notifications = [
  {
    title: "Low stock alert for Raw Materials",
    time: "10 min ago",
    type: "warning" as const,
  },
  {
    title: "Maintenance scheduled tomorrow",
    time: "1 hour ago",
    type: "info" as const,
  },
  {
    title: "New order received from Azam Ltd",
    time: "2 hours ago",
    type: "success" as const,
  },
];

const icons: Record<string, { icon: React.ReactNode; bg: string }> = {
  warning: {
    icon: <AlertTriangle className="size-4 text-warning" />,
    bg: "bg-warning/10",
  },
  info: {
    icon: <Bell className="size-4 text-info" />,
    bg: "bg-info/10",
  },
  success: {
    icon: <CheckCircle2 className="size-4 text-success" />,
    bg: "bg-success/10",
  },
};

export function NotificationsPanel() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Notifications</CardTitle>
        <button className="text-sm font-medium text-primary hover:underline">
          View All
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.map((notification, index) => (
            <div key={index} className="flex items-start gap-3">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  icons[notification.type]?.bg,
                )}
              >
                {icons[notification.type]?.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {notification.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {notification.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
