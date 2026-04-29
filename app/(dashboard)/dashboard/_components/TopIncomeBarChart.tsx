"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type CategorySummary = {
  category: string;
  totalAmount: number;
};

const chartConfig = {
  totalAmount: {
    label: "Income",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function TopIncomeBarChart({
  categories = [],
}: {
  categories?: CategorySummary[];
}) {
  const hasData = categories.length > 0;

  // Provide dummy data if no categories
  const chartData = hasData
    ? categories
    : [{ category: "No data", totalAmount: 1 }];

  const totalIncome = categories.reduce((sum, c) => sum + c.totalAmount, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Top Income Categories</CardTitle>
        <CardDescription>Highest earning category this month</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto w-full max-h-[200px]"
        >
          <BarChart data={chartData} layout="vertical" margin={{ right: 40 }}>
            <CartesianGrid horizontal={false} />

            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={70}
            />

            <XAxis type="number" hide />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => {
                    if (!hasData || totalIncome === 0) return null;

                    const percent = (
                      (Number(value) / totalIncome) *
                      100
                    ).toFixed(1);

                    const color =
                      item?.payload?.fill ?? item?.color ?? "hsl(var(--muted))";

                    return (
                      <div className="flex items-center gap-3">
                        <span
                          className="h-6 w-1 rounded-sm"
                          style={{ backgroundColor: color }}
                        />

                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">
                            ₹ {Number(value).toLocaleString()} ·{" "}
                            <span className="text-blue-500">{percent}%</span>
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
              }
            />

            <Bar
              dataKey="totalAmount"
              fill={hasData ? COLORS[0] : "hsl(var(--muted))"}
              radius={4}
            >
              {chartData.map((_, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={hasData ? COLORS[i % COLORS.length] : "var(--muted)"}
                />
              ))}

              {hasData && (
                <LabelList
                  dataKey="totalAmount"
                  position="right"
                  className="fill-foreground"
                  fontSize={12}
                />
              )}
            </Bar>
          </BarChart>
        </ChartContainer>
        {!hasData && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            No income data available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
