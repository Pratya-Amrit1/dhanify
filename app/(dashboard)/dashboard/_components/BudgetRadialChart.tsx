"use client";

import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/cn";

type RadialChartProps = {
  totalBudget: number;
  spent: number;
};

export function BudgetRadialChart({ totalBudget, spent }: RadialChartProps) {
  const hasBudget = totalBudget > 0;

  // allow >100 for messaging, cap chart at 100
  const rawPercentUsed = hasBudget
    ? Math.round((spent / totalBudget) * 100)
    : 0;

  const percentUsed = Math.min(rawPercentUsed, 100);

  // ---- Severity & colors  ----
  const statusConfig = !hasBudget
    ? {
        text: "No monthly budget has been set.",
        spentColor: "var(--muted)",
      }
    : rawPercentUsed < 75
      ? {
          text: "You are within a safe spending limit.",
          className: "text-emerald-500",
          spentColor: "#22c55e",
        }
      : rawPercentUsed < 90
        ? {
            text: "Warning: Spending is nearing the monthly budget cap.",
            className: "text-yellow-500",
            spentColor: "#ca8a04",
          }
        : rawPercentUsed < 100
          ? {
              text: "High risk: You are very close to your monthly budget.",
              className: "text-orange-500",
              spentColor: "#f97316",
            }
          : {
              text: "Critical: You have exceeded your monthly budget.",
              className: "text-red-500",
              spentColor: "#dc2626",
            };

  /**
   * IMPORTANT:
   * Recharts does NOT render RadialBarChart when all values are 0
   */
  const chartData = hasBudget
    ? [
        {
          name: "Budget",
          spent: percentUsed,
          remaining: Math.max(100 - percentUsed, 0),
        },
      ]
    : [
        {
          name: "No budget",
          spent: 1, // dummy value so chart renders
          remaining: 0,
        },
      ];

  const chartConfig = {
    spent: {
      label: "Spent",
      color: statusConfig.spentColor,
    },
    remaining: {
      label: "Remaining",
      color: "var(--muted-foreground/20)",
    },
  } satisfies ChartConfig;

  return (
    <Card className="h-full">
      {/* Header */}
      <CardHeader className="items-center">
        <CardTitle>Budget Progress</CardTitle>
        <CardDescription>This month’s budget progress</CardDescription>
      </CardHeader>

      {/* Chart */}
      <CardContent className="flex justify-center p-0">
        <ChartContainer
          config={chartConfig}
          className="w-full aspect-square h-[180px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={180}
            endAngle={0}
            innerRadius={70}
            outerRadius={110}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            {/* Center label */}
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (
                    !viewBox ||
                    !("cx" in viewBox) ||
                    !("cy" in viewBox) ||
                    typeof (viewBox as any).cx !== "number" ||
                    typeof (viewBox as any).cy !== "number"
                  ) {
                    return null;
                  }

                  const cx = (viewBox as any).cx;
                  const cy = (viewBox as any).cy;

                  return (
                    <text x={cx} y={cy} textAnchor="middle">
                      <tspan
                        x={cx}
                        y={cy - 10}
                        className="fill-foreground text-2xl font-bold"
                      >
                        {hasBudget ? `${rawPercentUsed}%` : "—"}
                      </tspan>
                      <tspan
                        x={cx}
                        y={cy + 10}
                        className="fill-muted-foreground text-sm"
                      >
                        {hasBudget ? "used" : "no budget"}
                      </tspan>
                    </text>
                  );
                }}
              />
            </PolarRadiusAxis>

            {/* Bars */}
            <RadialBar
              dataKey="spent"
              stackId="a"
              cornerRadius={6}
              fill={statusConfig.spentColor}
              className="stroke-transparent"
            />

            <RadialBar
              dataKey="remaining"
              stackId="a"
              cornerRadius={6}
              fill="currentColor"
              className="text-muted-foreground/20 stroke-transparent"
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>

      {/* Footer */}
      <CardFooter className="flex flex-col items-center pt-2">
        <p
          className={cn(
            "text-sm font-semibold mb-2 text-center",
            statusConfig.className,
          )}
        >
          {statusConfig.text}
        </p>

        {hasBudget && (
          <p className="text-sm text-muted-foreground text-center">
            Spent{" "}
            <span className="font-semibold">₹{spent.toLocaleString()}</span> out
            of{" "}
            <span className="font-semibold">
              ₹{totalBudget.toLocaleString()}
            </span>{" "}
            this month
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
