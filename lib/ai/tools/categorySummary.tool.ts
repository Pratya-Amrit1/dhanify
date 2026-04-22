import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/data/users/auth";
import {
  decimalToNumber,
  resolveCustomRange,
  resolvePresetRange,
  resolveUserTimezone,
} from "./helper";

/* ----------------------------------------
   Zod schema
----------------------------------------- */
export const CategorySummarySchema = z
  .object({
    type: z.enum(["EXPENSE", "INCOME"]),
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
    limit: z.number().optional(),
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
export const categorySummaryTool = tool(
  async (input: z.infer<typeof CategorySummarySchema>) => {
    console.log("🛠️ category_summary called");

    const user = await requireUser();
    const timezone = await resolveUserTimezone(user.clerkUserId);

    const { type, timeframe, startDate, endDate, limit = 5 } = input;

    const { start, end } =
      timeframe === "CUSTOM"
        ? resolveCustomRange({ startDate, endDate, timezone })
        : resolvePresetRange({ timeframe, timezone });

    const where = {
      userId: user.id,
      date: { gte: start, lte: end },
      type,
    };

    const grouped = await prisma.transaction.groupBy({
      by: ["category"],
      where,
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: "desc",
        },
      },
    });

    const categoryBreakdown = grouped
      .map((g) => ({
        category: g.category,
        totalAmount: g._sum.amount ? decimalToNumber(g._sum.amount) : 0,
      }))
      .slice(0, limit);

    return {
      timeframe,
      start: start.toISOString(),
      end: end.toISOString(),
      timezone,
      type,
      topCategories: categoryBreakdown,
    };
  },
  {
    name: "category_summary",
    description: "Summarize top spending or income grouped by categories for a given timeframe.",
    schema: CategorySummarySchema,
  },
);
