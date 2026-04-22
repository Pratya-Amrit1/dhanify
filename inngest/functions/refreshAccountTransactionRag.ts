import { inngest } from "../client";
import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_SUMMARY_WINDOW_DAYS,
  upsertAccountTransactionSummaryRag,
  upsertAccountMonthlyTransactionSummaryRag,
} from "@/lib/data/accounts/rag";

const WINDOW_MS = ACCOUNT_SUMMARY_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export const refreshAccountTransactionRag = inngest.createFunction(
  {
    id: "refresh-account-transaction-rag",
    name: "Refresh Account Transaction Summaries",
  },
  {
    cron: "0 2 * * *", // daily at 2am
  },
  async ({ step }) => {
    const windowCutoff = new Date(Date.now() - WINDOW_MS);
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const fetchFrom =
      currentMonthStart.getTime() < windowCutoff.getTime()
        ? currentMonthStart
        : windowCutoff;
    const budgetCache = new Map<string, number | null>();

    const getBudgetAmount = async (userId: string): Promise<number | null> => {
      if (budgetCache.has(userId)) {
        return budgetCache.get(userId) ?? null;
      }

      const budget = await prisma.budget.findUnique({
        where: { userId },
        select: { amount: true },
      });

      const amount = budget ? Number(budget.amount) : null;
      budgetCache.set(userId, amount);
      return amount;
    };

    const accounts = await step.run("fetch-accounts", async () => {
      return prisma.account.findMany({
        select: {
          id: true,
          userId: true,
          name: true,
          type: true,
          balance: true,
        },
      });
    });

    for (const account of accounts) {
      await step.run(`process-account-${account.id}`, async () => {
        const transactions = await prisma.transaction.findMany({
          where: {
            accountId: account.id,
            date: { gte: fetchFrom },
          },
          orderBy: [{ date: "desc" }, { id: "desc" }],
          select: {
            amount: true,
            type: true,
            category: true,
            description: true,
            date: true,
          },
        });

        const budgetAmount = await getBudgetAmount(account.userId);

        await upsertAccountTransactionSummaryRag({
          userId: account.userId,
          accountId: account.id,
          accountName: account.name,
          accountType: account.type,
          accountBalance: Number(account.balance),
          transactions,
          budgetAmount,
        });

        await upsertAccountMonthlyTransactionSummaryRag({
          userId: account.userId,
          accountId: account.id,
          accountName: account.name,
          accountType: account.type,
          accountBalance: Number(account.balance),
          transactions,
          budgetAmount,
          summaryMonth: currentMonthStart,
        });
      });
    }
  },
);
