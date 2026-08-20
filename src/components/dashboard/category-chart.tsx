"use client";

import { Pie, PieChart } from "recharts";
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
import { useIndustryCategories } from "@/hooks/analytics";

const CATEGORY_COLORS: Record<string, string> = {
  MANUFACTURER: "#067eda",
  WAREHOUSE: "#00953C",
  DISTRIBUTOR: "#facb2d",
  RETAILER: "#C62828",
  SHOP: "#00A1DE",
  REGULATOR: "#8994A3",
  CONSUMER: "#5F6B7A",
};

const CATEGORY_LABELS: Record<string, string> = {
  MANUFACTURER: "Manufacturing",
  WAREHOUSE: "Warehousing",
  DISTRIBUTOR: "Distribution",
  RETAILER: "Retail",
  SHOP: "Shop",
  REGULATOR: "Regulator",
  CONSUMER: "Consumer",
};

export function CategoryChart() {
  const { data: categories, isLoading } = useIndustryCategories();

  const total = categories?.reduce((sum, c) => sum + c.count, 0) ?? 0;

  const chartData =
    categories?.map((c) => ({
      category: CATEGORY_LABELS[c.category] ?? c.category,
      value: total > 0 ? Math.round((c.count / total) * 100) : 0,
      count: c.count,
      employees: c.totalEmployees,
      fill: CATEGORY_COLORS[c.category] ?? "#8994A3",
    })) ?? [];

  const chartConfig = Object.fromEntries(
    chartData.map((d) => [
      d.category,
      { label: d.category, color: d.fill },
    ])
  ) satisfies ChartConfig;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Industries by Category</CardTitle>
        <div className="text-sm text-muted-foreground">This Year</div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-8">
          <ChartContainer
            config={chartConfig}
            className="h-[220px] w-[220px] shrink-0"
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name) => [
                      `${value}%`,
                      String(name),
                    ]}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="category"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              />
            </PieChart>
          </ChartContainer>

          {/* Custom legend */}
          <div className="flex-1 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-full bg-muted" />
                      <div className="h-3 w-24 rounded bg-muted" />
                    </div>
                    <div className="h-3 w-8 rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              chartData.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-sm text-foreground">{item.category}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {item.value}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
