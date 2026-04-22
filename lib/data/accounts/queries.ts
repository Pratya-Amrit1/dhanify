import "server-only";

import { prisma } from "@/lib/prisma";
import { requireUser } from "../users/auth";
import { serialize } from "@/lib/utils/serialize";

export const getAccounts = async () => {
  const user = await requireUser();

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return accounts.map(serialize);
};

// ---------------------------------------- //

// Fetch all transactions for an account without server-side pagination.
// Used for client-side pagination and analytics (e.g. charts).
export const getAllTransactionsByAccountId = async (accountId: string) => {
  const user = await requireUser();

  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
    select: {
      name: true,
      balance: true,
      type: true,
      isDefault: true,
      _count: { select: { transactions: true } },
    },
  });

  if (!account) return null;

  const transactions = await prisma.transaction.findMany({
    where: { accountId },
    orderBy: [{ date: "desc" }, { id: "desc" }],
  });

  return {
    account: serialize({
      name: account.name,
      balance: account.balance,
      type: account.type,
      isDefault: account.isDefault,
      totalTransactions: account._count.transactions,
    }),
    transactions: transactions.map(serialize),
  };
};
