"use client";

import type { ComponentProps, ComponentType, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  tabsListVariants,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

export type PageTabBadgeVariant = NonNullable<
  ComponentProps<typeof Badge>["variant"]
>;

export type PageTabItem = {
  value: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  /** Shown only when greater than 0. */
  count?: number;
  badgeVariant?: PageTabBadgeVariant;
};

type ListVariant = NonNullable<VariantProps<typeof tabsListVariants>["variant"]>;

export function PageTabs({
  value,
  onValueChange,
  items,
  children,
  variant = "default",
  fullWidth = false,
  className,
  listClassName,
}: {
  value: string;
  onValueChange: (value: string) => void;
  items: PageTabItem[];
  children?: ReactNode;
  variant?: ListVariant;
  /** Stretch the list across the row (common for detail pages). */
  fullWidth?: boolean;
  className?: string;
  listClassName?: string;
}) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className={className}>
      <TabsList
        variant={variant}
        className={cn(fullWidth && "w-full", listClassName)}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const showCount = typeof item.count === "number" && item.count > 0;
          return (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className={cn(fullWidth && "flex-1")}
            >
              {Icon ? <Icon className="size-4" /> : null}
              {item.label}
              {showCount ? (
                <Badge
                  variant={item.badgeVariant ?? "secondary"}
                  className="h-5 min-h-5 rounded-full px-1.5 text-[10px]"
                >
                  {item.count}
                </Badge>
              ) : null}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {children}
    </Tabs>
  );
}

export { TabsContent };
