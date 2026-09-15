"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  title: string;
  value: string | number;
  badge?: string;
  badgeType?: "positive" | "negative" | "neutral";
  trendText?: string;
  trendType?: "up" | "down" | "neutral";
  caption?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  className?: string;
  /** When set the entire card becomes a clickable link to this path. */
  href?: string;
}

export function MetricCard({
  title,
  value,
  badge,
  badgeType = "positive",
  trendText,
  trendType = "up",
  caption,
  icon,
  iconBg,
  className,
  href,
}: MetricCardProps) {
  const card = (
    <Card className={cn(
      "border border-border/80 bg-card p-3 lg:p-4 shadow-xs transition-shadow hover:shadow-sm",
      href && "cursor-pointer hover:border-primary/30 hover:shadow-md transition-all",
      className,
    )}>
      <CardContent className="relative space-y-2 p-0">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:text-xs">
            {title}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {badge && (
              <Badge
                variant="outline"
                className={cn(
                  "h-5 rounded-full border px-1.5 py-px text-[10px] font-semibold lg:h-6 lg:text-xs",
                  badgeType === "positive" && "border-transparent bg-success text-white",
                  badgeType === "negative" && "border-transparent bg-danger text-white",
                  badgeType === "neutral" && "border-border bg-muted text-muted-foreground",
                )}
              >
                {badge}
              </Badge>
            )}
            {icon && (
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg text-white lg:size-9",
                  iconBg ?? "bg-primary",
                )}
              >
                {icon}
              </div>
            )}
          </div>
        </div>

        <h3 className="text-xl font-bold tracking-tight text-foreground lg:text-2xl">{value}</h3>

        <div className="space-y-px">
          {trendText && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground lg:text-sm">
              <span>{trendText}</span>
              {trendType === "up" && <ArrowUpRight className="size-3 text-success lg:size-3.5" />}
              {trendType === "down" && <ArrowDownRight className="size-3 text-danger lg:size-3.5" />}
            </div>
          )}
          {caption && <p className="text-[10px] text-faint lg:text-xs">{caption}</p>}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl">
        {card}
      </Link>
    );
  }
  return card;
}

interface StatCardProps {
  title?: string;
  value?: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export function StatCard({ title, value, change, changeType }: StatCardProps) {
  return (
    <MetricCard
      title={title ?? ""}
      value={value ?? "—"}
      badge={change}
      badgeType={changeType}
      trendText={change}
    />
  );
}
