"use client";

import { Pie, PieChart, Sector, Cell } from "recharts";
import { type PieSectorDataItem } from "recharts/types/polar/Pie";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const chartConfig = {
  expense: { label: "Expense" },
} satisfies ChartConfig;

export function TopExpensePieChart({
  categories = [],
}: {
  categories?: CategorySummary[];
}) {
  const hasData = categories.length > 0;

  const data = hasData
    ? categories.map((c) => ({
        name: c.category,
        value: c.totalAmount,
      }))
    : [{ name: "No data", value: 1 }];

  const totalExpense = categories.reduce((sum, c) => sum + c.totalAmount, 0);

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle>Top Expense Categories</CardTitle>
        <CardDescription>Highest spending category this month</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[260px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name, props) => {
                    if (!hasData || totalExpense === 0) return null;

                    const percent = (
                      (Number(value) / totalExpense) *
                      100
                    ).toFixed(1);

                    const color = props?.payload?.fill ?? "hsl(var(--muted))";

                    return (
                      <div className="flex items-center gap-3">
                        <span
                          className="h-6 w-1 rounded-sm"
                          style={{ backgroundColor: color }}
                        />

                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {String(name)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ₹ {Number(value).toLocaleString()} ·
                            <span className="text-blue-500">{percent}%</span>
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
              }
            />

            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              strokeWidth={4}
              activeIndex={hasData ? 0 : undefined}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <Sector {...props} outerRadius={outerRadius + 8} />
              )}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={
                    hasData ? COLORS[index % COLORS.length] : "var(--muted)"
                  }
                />
              ))}
            </Pie>

            {hasData && (
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground"
              >
                <tspan className="text-xl font-bold">
                  ₹ {totalExpense.toFixed(0)}
                </tspan>
                <tspan
                  x="50%"
                  dy="1.4em"
                  className="text-sm fill-muted-foreground"
                >
                  Total Expense
                </tspan>
              </text>
            )}
          </PieChart>
        </ChartContainer>

        {!hasData && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            No expense data available
          </p>
        )}
      </CardContent>
      {hasData && (
        <CardFooter className="flex justify-center gap-6 border-t pt-4 text-xs text-muted-foreground">
          {data.map((d, index) => (
            <div key={d.name} className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="font-medium text-muted-foreground">
                {d.name}
              </span>
            </div>
          ))}
        </CardFooter>
      )}
    </Card>
  );
}
