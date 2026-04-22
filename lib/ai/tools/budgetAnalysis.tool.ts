import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/data/users/auth";
import {
  resolveCustomRange,
  resolvePresetRange,
  resolveUserTimezone,
  decimalToNumber,
} from "./helper";

/* ----------------------------------------
   Zod schema
----------------------------------------- */
export const BudgetAnalysisSchema = z
  .object({
    timeframe: z.enum([
      "THIS_MONTH",
      "LAST_MONTH",
      "CUSTOM",
    ]),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.timeframe === "CUSTOM") {
      if (!data.startDate || !data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "startDate and endDate are required for CUSTOM timeframe",
        });
      }
    }
  });

/* ----------------------------------------
   Tool implementation
----------------------------------------- */
export const budgetAnalysisTool = tool(
  async (input: z.infer<typeof BudgetAnalysisSchema>) => {
    console.log("🛠️ budget_analysis called");

    const user = await requireUser();
    const timezone = await resolveUserTimezone(user.clerkUserId);

    const { timeframe, startDate, endDate } = input;

    const { start, end } =
      timeframe === "CUSTOM"
        ? resolveCustomRange({ startDate, endDate, timezone })
        : resolvePresetRange({ timeframe, timezone });

    // Fetch user's budget limit
    const budget = await prisma.budget.findUnique({
      where: { userId: user.id },
    });

    const budgetLimit = budget ? decimalToNumber(budget.amount) : null;

    // Fetch total expenses for the timeframe
    const totalExpensesAggr = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        date: { gte: start, lte: end },
        type: "EXPENSE",
      },
      _sum: { amount: true },
    });

    const totalExpenses = totalExpensesAggr._sum.amount
      ? decimalToNumber(totalExpensesAggr._sum.amount)
      : 0;

    // Fetch top categories to highlight where money is going
    const grouped = await prisma.transaction.groupBy({
      by: ["category"],
      where: {
        userId: user.id,
        date: { gte: start, lte: end },
        type: "EXPENSE",
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    });

    const topCategories = grouped
      .map((g) => ({
        category: g.category,
        totalAmount: g._sum.amount ? decimalToNumber(g._sum.amount) : 0,
      }))
      .slice(0, 5);

    return {
      timeframe,
      start: start.toISOString(),
      end: end.toISOString(),
      timezone,
      budgetLimit,
      totalExpenses,
      topCategories,
      isOverBudget: budgetLimit !== null ? totalExpenses > budgetLimit : null,
      remainingBudget: budgetLimit !== null ? budgetLimit - totalExpenses : null,
    };
  },
  {
    name: "budget_analysis",
    description: "Analyze budget, total expenses, overspending, and top categories to highlight risks or unusual patterns for a timeframe.",
    schema: BudgetAnalysisSchema,
  },
);
