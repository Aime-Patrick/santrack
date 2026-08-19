"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartData = [
  { month: "Jan", production: 65 },
  { month: "Feb", production: 72 },
  { month: "Mar", production: 68 },
  { month: "Apr", production: 62 },
  { month: "May", production: 78 },
  { month: "Jun", production: 75 },
  { month: "Jul", production: 82 },
  { month: "Aug", production: 85.6 },
];

const chartConfig = {
  production: {
    label: "Production",
    color: "#0057B8",
  },
} satisfies ChartConfig;

export function ProductionChart() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Production Overview</CardTitle>
        <div className="text-sm text-muted-foreground">This Year</div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value) => [`${value}%`, "Production"]}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="production"
              stroke="var(--color-production)"
              fill="var(--color-production)"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
