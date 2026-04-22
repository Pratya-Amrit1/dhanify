import "server-only";

import { prisma } from "@/lib/prisma";
import { requireUser } from "../users/auth";
import { serialize } from "@/lib/utils/serialize";
import { Prisma, TransactionType } from "@prisma/client";
import { getKpiDateRange, KpiTimeRange } from "@/lib/utils/timerange";
import { resolveUserTimezone } from "@/lib/ai/tools/helper";

export type DashboardSummary = {
  accountId: string;
  accountName: string;
  accountType: string;
  balance: number;
  totalIncome: number;
  totalExpense: number;
  recentTransactions: {
    id: string;
    date: string;
    type: "INCOME" | "EXPENSE";
    category: string;
    amount: number;
    description: string | null;
  }[];
};

async function getDefaultAccountByUserId(userId: string) {
  return await prisma.account.findFirst({
    where: {
      userId: userId,
      isDefault: true,
    },
    select: {
      id: true,
      name: true,
      type: true,
      balance: true,
    },
  });
}

// get total income, total expense, recent transactions for default account
export default async function getDefaultAccountDataForDashboard(
  timeRange: KpiTimeRange = KpiTimeRange.THIS_YEAR,
): Promise<DashboardSummary | null> {
  const user = await requireUser();
  const timezone = await resolveUserTimezone(user.clerkUserId);

  const defaultAccount = await getDefaultAccountByUserId(user.id);
  if (!defaultAccount) return null;

  const dateFilter = getKpiDateRange(timeRange, timezone);

  const baseWhere: Prisma.TransactionWhereInput = {
    accountId: defaultAccount.id,
    ...(dateFilter && { date: dateFilter }),
  };

  const [incomeAgg, expenseAgg, recentTransactions] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        ...baseWhere,
        type: TransactionType.INCOME,
      },
      _sum: { amount: true },
    }),

    prisma.transaction.aggregate({
      where: {
        ...baseWhere,
        type: TransactionType.EXPENSE,
      },
      _sum: { amount: true },
    }),

    prisma.transaction.findMany({
      where: { accountId: defaultAccount.id }, // get recent transactions not only this month
      orderBy: { date: "desc" },
      take: 5,
      select: {
        id: true,
        date: true,
        description: true,
        type: true,
        amount: true,
        category: true,
      },
    }),
  ]);

  const rawResult = {
    accountId: defaultAccount.id,
    accountName: defaultAccount.name,
    accountType: defaultAccount.type,
    balance: defaultAccount.balance,
    totalIncome: incomeAgg._sum.amount ?? 0,
    totalExpense: expenseAgg._sum.amount ?? 0,
    recentTransactions,
  };

  return serialize(rawResult) as DashboardSummary;
}

// get top income and expense categories for default account
export type CategorySummary = {
  category: string;
  totalAmount: number;
};

export async function getTopCategoriesForDashboard(
  timeRange: KpiTimeRange = KpiTimeRange.ALL_TIME,
) {
  const user = await requireUser();
  const timezone = await resolveUserTimezone(user.clerkUserId);

  const defaultAccount = await getDefaultAccountByUserId(user.id);

  if (!defaultAccount)
    return {
      topIncomeCategories: [],
      topExpenseCategories: [],
    };

  const dateFilter = getKpiDateRange(timeRange, timezone);

  const baseWhere: Prisma.TransactionWhereInput = {
    accountId: defaultAccount.id,
    ...(dateFilter && { date: dateFilter }),
  };

  const groupedData = await prisma.transaction.groupBy({
    by: ["category", "type"],
    where: baseWhere,
    _sum: {
      amount: true,
    },
  });

  const incomeCategories: CategorySummary[] = [];
  const expenseCategories: CategorySummary[] = [];

  for (const row of groupedData) {
    const item = {
      category: row.category,
      totalAmount: Number(row._sum.amount ?? 0),
    };

    if (row.type === TransactionType.INCOME) {
      incomeCategories.push(item);
    } else if (row.type === TransactionType.EXPENSE) {
      expenseCategories.push(item);
    }
  }

  return {
    topIncomeCategories: incomeCategories
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5),

    topExpenseCategories: expenseCategories
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5),
  };
}
