import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { getCurrentBudget } from "@/lib/data/budget/queries";
import { getTopCategoriesForDashboard } from "@/lib/data/dashboard/queries";
import { KpiTimeRange } from "@/lib/utils/timerange";
import BudgetForm from "./BudgetForm";

export default async function BudgetPage() {
  const budgetResult = await getCurrentBudget();
  const categoryResult = await getTopCategoriesForDashboard(
    KpiTimeRange.THIS_MONTH,
  );

  const amount = budgetResult?.budget?.amount ?? 0;
  const totalExpenses = budgetResult?.totalExpenses ?? 0;

  const percent =
    amount > 0 ? Math.min(100, Math.round((totalExpenses / amount) * 100)) : 0;

  const indicatorClass =
    percent >= 90
      ? "bg-red-600"
      : percent >= 75
        ? "bg-yellow-500"
        : "bg-emerald-600";

  /* ---------------------------
     TOP CATEGORIES + OTHERS
  ---------------------------- */
  const topCategories = categoryResult.topExpenseCategories.slice(0, 5);

  const topTotal = topCategories.reduce(
    (sum, item) => sum + item.totalAmount,
    0,
  );

  const othersAmount = Math.max(0, totalExpenses - topTotal);

  const categoriesWithOthers = [
    ...topCategories.map((item) => ({
      label: item.category,
      amount: item.totalAmount,
      percent:
        totalExpenses > 0
          ? Math.round((item.totalAmount / totalExpenses) * 100)
          : 0,
    })),
    {
      label: "Others",
      amount: othersAmount,
      percent:
        totalExpenses > 0
          ? Math.round((othersAmount / totalExpenses) * 100)
          : 0,
    },
  ];

  const leftColumn = categoriesWithOthers.slice(0, 3);
  const rightColumn = categoriesWithOthers.slice(3, 6);

  const palette = [
    "bg-rose-500",
    "bg-indigo-500",
    "bg-amber-400",
    "bg-emerald-500",
    "bg-sky-500",
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* RIGHT SIDE — SETTINGS */}
      <Card className="lg:col-span-1 lg:order-2">
        <CardHeader className="border-b">
          <CardTitle>Budget settings</CardTitle>
          <CardDescription>
            Update your monthly limit and alerts
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <BudgetForm initialAmount={amount} />

          {/* Meaningful, non-redundant section */}
          <div className="rounded-md border bg-muted/30 p-3 text-sm hidden 2xl:block">
            <div className="font-semibold">Smart budgeting tip</div>
            <p className="mt-1 text-muted-foreground text-xs">
              Maintaining a budget slightly below your typical spending can
              reduce overspending and improve monthly savings.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* LEFT SIDE CONTENT */}
      <div className="space-y-6 lg:col-span-2 lg:order-1">
        {/* BUDGET PROGRESS */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly usage</CardTitle>
            <CardDescription>
              ₹{totalExpenses.toLocaleString()} spent of ₹
              {amount.toLocaleString()}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <Progress
              value={percent}
              indicatorClassName={indicatorClass}
              className="h-2"
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{percent}% used</span>
              <span>
                ₹{Math.max(0, amount - totalExpenses).toLocaleString()}{" "}
                remaining
              </span>
            </div>
          </CardContent>
        </Card>

        {/* TOP SPENDING CATEGORIES */}
        <Card>
          <CardHeader>
            <CardTitle>Top spending categories</CardTitle>
            <CardDescription>
              Where most of your money goes this month
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="mx-auto max-w-3xl p-4 bg-secondary/30 rounded-lg h-full">
              {totalExpenses === 0 ? (
                <div className="flex min-h-[180px] items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    No expense data available
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Vertical separator */}
                    <div className="hidden sm:block absolute left-1/2 top-0 h-full w-px bg-border" />

                    {[leftColumn, rightColumn].map((col, colIndex) => (
                      <div className="space-y-2" key={colIndex}>
                        {col.map((item, idx) => {
                          const globalIndex = colIndex * 3 + idx;
                          const colorClass =
                            item.label === "Others"
                              ? "bg-muted-foreground/40"
                              : palette[globalIndex % palette.length];

                          return (
                            <div
                              key={item.label}
                              className="flex items-center justify-between gap-4 rounded-md px-2 py-2 max-w-md hover:bg-muted/40 transition"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className={`h-3 w-3 rounded-full shrink-0 ${colorClass}`}
                                />
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium">
                                    {item.label}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {item.percent}% of spending
                                  </div>
                                </div>
                              </div>

                              <div className="text-right w-28">
                                <div className="text-sm font-medium">
                                  ₹{item.amount.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
