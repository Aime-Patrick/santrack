"use client";

import { AlertTriangle, Bell, CheckCircle2, Package, Truck, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/components/providers/notification-provider";
import Link from "next/link";

const typeConfig: Record<string, { icon: React.ReactNode; bg: string }> = {
  warning: {
    icon: <AlertTriangle className="size-4 text-warning" />,
    bg: "bg-amber-50",
  },
  info: {
    icon: <Bell className="size-4 text-info" />,
    bg: "bg-primary-light",
  },
  success: {
    icon: <CheckCircle2 className="size-4 text-success" />,
    bg: "bg-emerald-50",
  },
  RECALLED: {
    icon: <AlertTriangle className="size-4 text-danger" />,
    bg: "bg-red-50",
  },
  TRANSFERRED: {
    icon: <Truck className="size-4 text-primary" />,
    bg: "bg-primary-light",
  },
  SOLD: {
    icon: <ShoppingCart className="size-4 text-success" />,
    bg: "bg-emerald-50",
  },
  REGISTERED: {
    icon: <Package className="size-4 text-primary" />,
    bg: "bg-primary-light",
  },
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  } catch {
    return iso;
  }
}

export function NotificationsPanel() {
  const { notifications, unreadCount, markAllRead, connected } = useNotifications();

  const displayNotifications = notifications.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>Notifications</CardTitle>
          {unreadCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs h-7">
              Mark all read
            </Button>
          )}
          <div className={cn(
            "size-2 rounded-full",
            connected ? "bg-success" : "bg-muted"
          )} />
        </div>
      </CardHeader>
      <CardContent>
        {displayNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted mb-3">
              <Bell className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-faint">You&apos;ll see real-time updates here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayNotifications.map((notification) => {
              const config = typeConfig[notification.type] ?? typeConfig.info;
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-2 rounded-lg transition-colors",
                    !notification.read && "bg-muted/50"
                  )}
                >
                  <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", config.bg)}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    {notification.actionUrl ? (
                      <Link href={notification.actionUrl} className="block hover:underline">
                        <p className="text-sm font-medium text-foreground truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {notification.message}
                        </p>
                      </Link>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-foreground truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {notification.message}
                        </p>
                      </>
                    )}
                    <p className="text-[10px] text-faint mt-0.5">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
