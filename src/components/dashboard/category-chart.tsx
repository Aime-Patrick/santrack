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
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartData = [
  { category: "Manufacturing", value: 42, fill: "#0057B8" },
  { category: "Agro Processing", value: 28, fill: "#00953C" },
  { category: "Mining & Quarrying", value: 15, fill: "#fac600" },
  { category: "Construction", value: 10, fill: "#00A1DE" },
  { category: "Others", value: 5, fill: "#8994A3" },
];

const chartConfig = {
  value: {
    label: "Industries",
  },
  Manufacturing: {
    label: "Manufacturing",
    color: "#0057B8",
  },
  "Agro Processing": {
    label: "Agro Processing",
    color: "#00953C",
  },
  "Mining & Quarrying": {
    label: "Mining & Quarrying",
    color: "#fac600",
  },
  Construction: {
    label: "Construction",
    color: "#00A1DE",
  },
  Others: {
    label: "Others",
    color: "#8994A3",
  },
} satisfies ChartConfig;

export function CategoryChart() {
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
                    formatter={(value) => [`${value}%`, "Share"]}
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
            {chartData.map((item) => (
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
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
