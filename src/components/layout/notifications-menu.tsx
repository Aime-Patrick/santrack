"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CircleAlert,
  Info,
  ArrowRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/components/providers/notification-provider";
import { cn } from "@/lib/utils";
import {
  actionLabel,
  matchesFilter,
  moduleLabel,
  needsAction,
  notificationTone,
  relativeTime,
  sortInbox,
  type InboxFilter,
  type InboxNotification,
} from "@/lib/notification-intelligence";

const TONE_CHIP: Record<
  ReturnType<typeof notificationTone>,
  { className: string; icon: typeof Info }
> = {
  info: { className: "bg-[#067eda] text-white", icon: Info },
  success: { className: "bg-[#00953C] text-white", icon: CheckCircle2 },
  warning: { className: "bg-[#fac600] text-white", icon: AlertTriangle },
  error: { className: "bg-danger text-white", icon: CircleAlert },
};

const FILTERS: { id: InboxFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "action", label: "Needs action" },
  { id: "updates", label: "Updates" },
];

export function NotificationsMenu() {
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<InboxFilter>("all");

  const ranked = React.useMemo(
    () => sortInbox(notifications as InboxNotification[]),
    [notifications],
  );
  const actionCount = ranked.filter((item) => needsAction(item) && !item.read).length;
  const visible = ranked.filter((item) => matchesFilter(item, filter));
  const badge = unreadCount > 9 ? "9+" : String(unreadCount);

  function openItem(item: InboxNotification) {
    if (!item.read) markRead(item.id);
    setOpen(false);
    if (item.actionUrl) router.push(item.actionUrl);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="relative flex size-9 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            title="Notifications"
          />
        }
      >
        <Bell className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs font-bold text-white ring-2 ring-white">
            {badge}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(28rem,calc(100vw-1.5rem))] overflow-hidden p-0 shadow-lg sm:w-[30rem]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-sm font-medium text-primary hover:underline cursor-pointer"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-border/50 px-4 py-3">
          {FILTERS.map((option) => {
            const count =
              option.id === "action"
                ? actionCount
                : option.id === "all"
                  ? unreadCount
                  : ranked.filter((item) => !needsAction(item) && !item.read).length;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors cursor-pointer",
                  filter === option.id
                    ? "bg-[#067eda] text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
                {count > 0 && (
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold",
                      filter === option.id ? "bg-white/25 text-white" : "bg-background text-foreground",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="max-h-[min(32rem,70vh)] space-y-2 overflow-y-auto p-3">
          {visible.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto mb-3 size-6 text-muted-foreground/60" />
              <p className="text-sm font-semibold text-foreground">
                {filter === "action" ? "No action waiting" : "No notifications yet"}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {filter === "action"
                  ? "Approvals, cases, recalls, and QC alerts will land here."
                  : "Licence, registration, and stock events will appear as they happen."}
              </p>
            </div>
          ) : (
            visible.map((item) => {
              const tone = notificationTone(item.type);
              const Icon = TONE_CHIP[tone].icon;
              const cta = actionLabel(item.actionUrl);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className={cn(
                    "w-full rounded-xl p-3.5 text-left transition-colors cursor-pointer",
                    item.read
                      ? "hover:bg-muted/60"
                      : "bg-[#f0f7ff] hover:bg-[#e4f1fc]",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                        TONE_CHIP[tone].className,
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug text-foreground">
                          {item.title}
                        </p>
                        {!item.read && (
                          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#067eda]" />
                        )}
                      </div>
                      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {item.message}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          {moduleLabel(item.module, item.actionUrl)} · {relativeTime(item.createdAt)}
                        </span>
                        {item.actionUrl && (
                          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#067eda]">
                            {cta}
                            <ArrowRight className="size-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
