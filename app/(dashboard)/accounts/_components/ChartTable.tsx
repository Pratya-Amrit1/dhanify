"use client";

import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";

import { ChartColumnBigIcon } from "lucide-react";

const chartConfig = {
  income: {
    label: "Income",
    // Tailwind green-500
    color: "#22c55e",
  },
  expense: {
    label: "Expense",
    // Tailwind red-500
    color: "#ef4444",
  },
} satisfies ChartConfig;

type ChartTransaction = {
  id: string;
  date: string | Date;
  amount: number | string;
  type: "INCOME" | "EXPENSE";
};

interface ChartTableProps {
  transactions: ChartTransaction[];
}

interface DateRange {
  label: string;
  days: number | null; // null = all time
}

interface DateRanges {
  [key: string]: DateRange;
}

const DATE_RANGES: DateRanges = {
  "7D": { label: "Last 7 Days", days: 7 },
  "30D": { label: "Last 30 Days", days: 30 },
  "90D": { label: "Last 90 Days", days: 90 },
  "1Y": { label: "Last 365 Days", days: 365 },
  ALL: { label: "All Time", days: null },
};

interface Group {
  date: string; // ISO string key
  income: number;
  expense: number;
}

interface GroupOfTransactions {
  [key: string]: Group;
}
export default function ChartTable({ transactions }: ChartTableProps) {
  const [dateRange, setDateRange] =
    useState<Extract<keyof typeof DATE_RANGES, string>>("30D");

  const filteredData = useMemo(() => {
    const range = DATE_RANGES[dateRange];
    if (transactions.length === 0) return [];

    // Rolling range: now is always the current moment
    const now = new Date();
    const startDay = range.days
      ? startOfDay(subDays(now, range.days))
      : startOfDay(new Date(0));

    // Filter transactions by rolling date range
    const filteredTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= startDay && date <= endOfDay(now);
    });

    // Group by date (ISO format for multi-year safety)
    const grouped: GroupOfTransactions = filteredTransactions.reduce(
      (acc, transaction) => {
        const dateKey = format(new Date(transaction.date), "yyyy-MM-dd"); // ISO date string

        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: dateKey,
            income: 0,
            expense: 0,
          };
        }

        if (transaction.type === "EXPENSE") {
          acc[dateKey].expense += Number(transaction.amount);
        } else {
          acc[dateKey].income += Number(transaction.amount);
        }

        return acc;
      },
      {} as GroupOfTransactions,
    );

    // Sort ascending by date
    return Object.values(grouped).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [transactions, dateRange]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, day) => ({
        income: acc.income + day.income,
        expense: acc.expense + day.expense,
      }),
      { income: 0, expense: 0 },
    );
  }, [filteredData]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">
            Transaction overview
          </CardTitle>
          <CardDescription>
            Income vs expense over time for this account.
          </CardDescription>
        </div>
        <Select defaultValue={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DATE_RANGES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 pb-6">
        <div className="flex justify-around mb-6 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground">Total Income</p>
            <p className="font-bold text-lg text-green-500">
              ₹ {totals.income.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Total Expense</p>
            <p className="font-bold text-lg text-red-500">
              ₹ {totals.expense.toFixed(2)}
            </p>
          </div>
          <div className="text-center hidden sm:block">
            <p className="text-muted-foreground">Net</p>
            <p
              className={`font-bold text-lg ${
                totals.income - totals.expense >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {totals.income - totals.expense < 0
                ? `-₹ ${Math.abs(totals.income - totals.expense).toFixed(2)}`
                : `₹ ${(totals.income - totals.expense).toFixed(2)}`}
            </p>
          </div>
        </div>

        <div className="min-w-0">
          {filteredData.length === 0 ? (
            <div className="flex h-[320px] flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-muted/30 text-center">
              <ChartColumnBigIcon className="h-8 w-8 text-muted-foreground" />

              <div className="space-y-2">
                <p className="text-sm font-medium">No transactions found</p>
                <p className="text-xs text-muted-foreground">
                  Add income or expenses to see trends here.
                </p>
              </div>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[320px] w-full">
              <BarChart accessibilityLayer data={filteredData}>
                <CartesianGrid vertical={false} />

                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => format(new Date(value), "MMM dd")}
                />

                <YAxis tickLine={false} axisLine={false} />

                <ChartTooltip
                  cursor={false}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;

                    return (
                      <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-sm">
                        <p className="mb-2 font-semibold text-popover-foreground">
                          {format(new Date(label), "MMM dd")}
                        </p>

                        <div className="space-y-1.5">
                          {payload.map((item) => {
                            const color = item.color ?? "currentColor";

                            return (
                              <div
                                key={item.dataKey}
                                className="flex items-center justify-between gap-4"
                              >
                                <div className="flex items-center gap-2">
                                  {/* vertical color line */}
                                  <span
                                    className="h-4 w-1 rounded-sm"
                                    style={{ backgroundColor: color }}
                                  />

                                  <span className="text-muted-foreground">
                                    {item.name}
                                  </span>
                                </div>

                                <span className="font-medium" style={{ color }}>
                                  ₹ {Number(item.value).toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }}
                />

                <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />

                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
      {filteredData.length > 0 && (
        <CardFooter className="flex justify-center gap-6 border-t pt-4 text-xs text-muted-foreground">
          {Object.entries(chartConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: config.color }}
              />
              <span className="font-medium text-muted-foreground">
                {config.label}
              </span>
            </div>
          ))}
        </CardFooter>
      )}
    </Card>
  );
}
