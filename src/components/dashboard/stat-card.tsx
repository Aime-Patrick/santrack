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
      "border border-border/80 bg-card p-4 lg:p-5 shadow-xs transition-shadow hover:shadow-sm",
      href && "cursor-pointer hover:shadow-md hover:border-primary/30 transition-all",
      className,
    )}>
      <CardContent className="p-0 space-y-2">
        <div className="flex items-center justify-between">
          {icon ? (
            <div className={cn("flex size-8 lg:size-9 items-center justify-center rounded-lg text-white", iconBg ?? "bg-primary")}>
              {icon}
            </div>
          ) : (
            <p className="text-[11px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
          )}
          {badge && (
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-1.5 py-px text-[10px] lg:text-xs font-semibold border h-5 lg:h-6",
                badgeType === "positive" && "border-transparent bg-success text-white",
                badgeType === "negative" && "border-transparent bg-danger text-white",
                badgeType === "neutral" && "border-border bg-muted text-muted-foreground"
              )}
            >
              {badge}
            </Badge>
          )}
        </div>

        <div>
          {!icon && <p className="text-[11px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>}
          <h3 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground">{value}</h3>
        </div>

        <div className="space-y-px">
          {trendText && (
            <div className="flex items-center gap-1 text-[11px] lg:text-xs text-muted-foreground">
              <span>{trendText}</span>
              {trendType === "up" && <ArrowUpRight className="size-3 lg:size-3.5 text-success" />}
              {trendType === "down" && <ArrowDownRight className="size-3 lg:size-3.5 text-danger" />}
            </div>
          )}
          {caption && <p className="text-[10px] lg:text-xs text-faint">{caption}</p>}
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
