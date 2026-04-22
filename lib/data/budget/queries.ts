import "server-only";
import { requireUser } from "../users/auth";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils/serialize";
import { Prisma } from "@prisma/client";

export async function getCurrentBudget() {
  const user = await requireUser();

  const budget = await prisma.budget.findUnique({
    where: { userId: user.id },
  });

  if (!budget) {
    return null;
  }

  // current date
  const currentDate = new Date();

  // start of the month
  const startOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  );
  // end of the month
  const endOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  );

  // total expenses for the month
  const txWhere: Prisma.TransactionWhereInput = {
    userId: user.id,
    type: "EXPENSE",
    date: {
      gte: startOfMonth,
      lte: endOfMonth,
    },
  };

  // Budget applies to the user's default account
  const defaultAccount = await prisma.account.findFirst({
    where: { userId: user.id, isDefault: true },
    select: { id: true },
  });

  if (defaultAccount) txWhere.accountId = defaultAccount.id;

  const totalExpenses = await prisma.transaction.aggregate({
    where: txWhere,
    _sum: {
      amount: true,
    },
  });

  return {
    budget: serialize(budget),
    totalExpenses: Number(totalExpenses._sum.amount ?? 0),
  };
}
