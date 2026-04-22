import { inngest } from "../client";
import { AccountType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { upsertAccountMonthlyTransactionSummaryRag } from "@/lib/data/accounts/rag";

interface TransactionChangeEventData {
  transaction?: {
    id?: string;
    userId?: string;
    accountId?: string;
    date?: string | Date | null;
    previousDate?: string | Date | null;
    accountName?: string;
    accountType?: AccountType;
    accountBalance?: number;
  };
  // When a transaction is deleted, send the last known snapshot here.
  deleted?: {
    userId?: string;
    accountId?: string;
    date?: string | Date | null;
    accountName?: string;
    accountType?: AccountType;
    accountBalance?: number;
  };
}

type AccountSnapshot = {
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
};

type MonthTarget = {
  accountId: string;
  summaryMonthStart: Date;
  summaryMonthEnd: Date;
  snapshotHint?: AccountSnapshot;
};

export const refreshAccountMonthlySummaryFromEvent = inngest.createFunction(
  {
    id: "refresh-account-monthly-summary-from-event",
    name: "Refresh Account Monthly Summary From Transaction Event",
    retries: 3,
  },
  {
    event: "transaction.changed",
  },
  async ({ event, step }) => {
    const data = (event.data ?? {}) as TransactionChangeEventData;
    const targets = buildMonthTargets(data);

    if (targets.length === 0) {
      console.warn(
        "[refresh-account-monthly-summary-from-event] No month targets derived",
        event.data,
      );
      return;
    }

    for (const target of targets) {
      const key = `${target.accountId}-${target.summaryMonthStart.toISOString().slice(0, 7)}`;
      await step.run(`recompute-monthly-summary-${key}`, async () => {
        const accountSnapshot = await ensureAccountSnapshot(
          target.accountId,
          target.snapshotHint,
        );

        if (!accountSnapshot) {
          console.warn(
            "[refresh-account-monthly-summary-from-event] Account snapshot missing",
            { accountId: target.accountId },
          );
          return;
        }

        const monthlyTransactions = await prisma.transaction.findMany({
          where: {
            accountId: target.accountId,
            date: {
              gte: target.summaryMonthStart,
              lt: target.summaryMonthEnd,
            },
          },
          orderBy: [{ date: "asc" }, { id: "asc" }],
          select: {
            amount: true,
            type: true,
            category: true,
            description: true,
            date: true,
          },
        });

        await upsertAccountMonthlyTransactionSummaryRag({
          userId: accountSnapshot.userId,
          accountId: target.accountId,
          accountName: accountSnapshot.name,
          accountType: accountSnapshot.type,
          accountBalance: accountSnapshot.balance,
          transactions: monthlyTransactions,
          summaryMonth: target.summaryMonthStart,
        });
      });
    }
  },
);

function buildMonthTargets(data: TransactionChangeEventData): MonthTarget[] {
  const targets: MonthTarget[] = [];
  const dedupe = new Map<string, MonthTarget>();

  const addTarget = (
    accountId?: string,
    dateInput?: string | Date | null,
    snapshotHint?: AccountSnapshot,
  ) => {
    if (!accountId || !dateInput) return;
    const normalizedDate = new Date(dateInput);
    if (Number.isNaN(normalizedDate.getTime())) return;
    const { start, end } = getMonthBoundaries(normalizedDate);
    const key = `${accountId}-${start.toISOString()}`;
    if (dedupe.has(key)) {
      const existing = dedupe.get(key)!;
      if (!existing.snapshotHint && snapshotHint) {
        existing.snapshotHint = snapshotHint;
      }
      return;
    }
    const target: MonthTarget = {
      accountId,
      summaryMonthStart: start,
      summaryMonthEnd: end,
      snapshotHint,
    };
    dedupe.set(key, target);
    targets.push(target);
  };

  const snapshot = normalizeAccountSnapshot(data.transaction ?? data.deleted);

  addTarget(data.transaction?.accountId, data.transaction?.date, snapshot);

  addTarget(
    data.transaction?.accountId,
    data.transaction?.previousDate,
    snapshot,
  );

  addTarget(data.deleted?.accountId, data.deleted?.date, snapshot);

  return targets;
}

function normalizeAccountSnapshot(
  transaction?:
    | TransactionChangeEventData["transaction"]
    | TransactionChangeEventData["deleted"],
): AccountSnapshot | undefined {
  if (
    !transaction?.userId ||
    !transaction.accountName ||
    !transaction.accountType
  ) {
    return undefined;
  }

  const balance =
    typeof transaction.accountBalance === "number"
      ? transaction.accountBalance
      : transaction.accountBalance
        ? Number(transaction.accountBalance)
        : 0;

  return {
    userId: transaction.userId,
    name: transaction.accountName,
    type: transaction.accountType,
    balance,
  };
}

async function ensureAccountSnapshot(
  accountId: string,
  hint?: AccountSnapshot,
): Promise<AccountSnapshot | undefined> {
  if (hint) {
    return hint;
  }

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: {
      userId: true,
      name: true,
      type: true,
      balance: true,
    },
  });

  if (!account) {
    return undefined;
  }

  return {
    userId: account.userId,
    name: account.name,
    type: account.type,
    balance: Number(account.balance),
  };
}

function getMonthBoundaries(anchor: Date) {
  const start = new Date(
    anchor.getFullYear(),
    anchor.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );
  const end = new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    1,
    0,
    0,
    0,
    0,
  );
  return { start, end };
}
