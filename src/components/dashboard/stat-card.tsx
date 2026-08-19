"use client";

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
}: MetricCardProps) {
  return (
    <Card className={cn("border border-border/80 bg-card p-4 shadow-xs transition-shadow hover:shadow-sm", className)}>
      <CardContent className="p-0 space-y-2">
        <div className="flex items-center justify-between">
          {icon ? (
            <div className={cn("flex size-8 items-center justify-center rounded-lg text-white", iconBg ?? "bg-primary")}>
              {icon}
            </div>
          ) : (
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
          )}
          {badge && (
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-1.5 py-px text-[10px] font-semibold border h-5",
                badgeType === "positive" && "border-success/30 bg-success/10 text-success",
                badgeType === "negative" && "border-danger/30 bg-danger/10 text-danger",
                badgeType === "neutral" && "border-border bg-muted/60 text-muted-foreground"
              )}
            >
              {badge}
            </Badge>
          )}
        </div>

        <div>
          {!icon && <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>}
          <h3 className="text-xl font-bold tracking-tight text-foreground">{value}</h3>
        </div>

        <div className="space-y-px">
          {trendText && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span>{trendText}</span>
              {trendType === "up" && <ArrowUpRight className="size-3 text-success" />}
              {trendType === "down" && <ArrowDownRight className="size-3 text-danger" />}
            </div>
          )}
          {caption && <p className="text-[10px] text-faint">{caption}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatCard(props: any) {
  return (
    <MetricCard
      title={props.title}
      value={props.value}
      badge={props.change}
      badgeType={props.changeType}
      trendText={props.change}
    />
  );
}
