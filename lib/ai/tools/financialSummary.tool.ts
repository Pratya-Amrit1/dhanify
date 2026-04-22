import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/data/users/auth";
import {
  decimalToNumber,
  resolveCustomRange,
  resolvePresetRange,
  resolveUserTimezone,
} from "../tools/helper";

/* ----------------------------------------
   Zod schema
----------------------------------------- */
export const FinancialSummarySchema = z
  .object({
    type: z.enum(["EXPENSE", "INCOME", "BOTH"]),
    timeframe: z.enum([
      "THIS_WEEK",
      "THIS_MONTH",
      "THIS_YEAR",
      "LAST_WEEK",
      "LAST_MONTH",
      "LAST_YEAR",
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
export const financialSummaryTool = tool(
  async (input: z.infer<typeof FinancialSummarySchema>) => {
    console.log("🛠️ financial_summary called");

    const user = await requireUser();
    const timezone = await resolveUserTimezone(user.clerkUserId);

    const { type, timeframe, startDate, endDate } = input;

    const { start, end } =
      timeframe === "CUSTOM"
        ? resolveCustomRange({ startDate, endDate, timezone })
        : resolvePresetRange({ timeframe, timezone });

    const where = {
      userId: user.id,
      date: { gte: start, lte: end },
      ...(type !== "BOTH" ? { type } : {}),
    };

    const transactions = await prisma.transaction.findMany({
      where,
      select: { amount: true, type: true },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of transactions) {
      const amount = decimalToNumber(tx.amount);
      if (tx.type === "INCOME") {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }
    }

    return {
      timeframe,
      start: start.toISOString(),
      end: end.toISOString(),
      timezone,
      totalIncome,
      totalExpense,
    };
  },
  {
    name: "financial_summary",
    description: "Summarize income and expenses for a given timeframe",
    schema: FinancialSummarySchema,
  },
);
