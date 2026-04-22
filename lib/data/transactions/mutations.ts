import "server-only";

import { Prisma, TransactionType } from "@prisma/client";
import {
  BulkTransactionParsedType,
  TransactionParsedType,
} from "@/lib/schemas/transaction.schema";
import { calculateNextRecurringDate } from "@/lib/utils/recurring";
import { ErrorCode } from "@/lib/constants/error-codes";
import { prisma } from "@/lib/prisma";
import { ImportJobStatus } from "@prisma/client";
import { upsertImportJob } from "../users/usages";

type CreateTransactionProps = {
  userId: string;
  account: { id: string; balance: Prisma.Decimal };
  data: TransactionParsedType;
  isReceiptScan: boolean;
  importId: string;
};

type updateTransactonProps = {
  id: string;
  userId: string;
  data: TransactionParsedType;
};

type bulkDeleteTransactionProps = {
  userId: string;
  transactionIds: string[];
};

export async function createTransaction({
  userId,
  account,
  data,
  isReceiptScan,
  importId,
}: CreateTransactionProps) {
  return await prisma.$transaction(async (tx) => {
    if (isReceiptScan && !importId) {
      throw new Error(ErrorCode.IMPORT_JOB_ID_NOT_FOUND);
    }

    // idempotency check
    if (isReceiptScan) {
      const existing = await tx.importJob.findUnique({
        where: { id_userId: { id: importId, userId } },
      });
      if (existing?.status === ImportJobStatus.SAVED) {
        throw new Error(ErrorCode.IMPORT_JOB_ALREADY_PROCESSED);
      }
    }

    const balanceChange =
      data.type === TransactionType.INCOME ? data.amount : -data.amount;

    // calculate new balance
    const newBalance = account.balance.add(balanceChange);

    if (newBalance.lessThan(0)) {
      throw new Error(ErrorCode.INSUFFICIENT_BALANCE);
    }

    // calculate next recurring date
    const nextRecurringDate =
      data.isRecurring && data.recurringInterval
        ? calculateNextRecurringDate(data.date, data.recurringInterval)
        : null;

    // create transaction
    const transaction = await tx.transaction.create({
      data: {
        ...data,
        userId,
        nextRecurringDate,
      },
    });

    //  atomic balance update
    await tx.account.update({
      where: { id: account.id },
      data: {
        balance: {
          increment: balanceChange,
        },
      },
    });

    // mark import job as saved
    if (isReceiptScan) {
      await upsertImportJob({
        importJobId: importId,
        userId,
        status: ImportJobStatus.SAVED,
        accountId: account.id,
        tx,
      });
    }

    return transaction;
  });
}

export async function updateTransaction({
  id,
  userId,
  data,
}: updateTransactonProps) {
  // get existing transaction
  return prisma.$transaction(async (tx) => {
    const existingTransaction = await tx.transaction.findFirst({
      where: { id, userId },
      include: { account: true },
    });

    if (!existingTransaction) {
      throw new Error(ErrorCode.TRANSACTION_NOT_FOUND);
    }

    // calculate balance changes
    const oldBalanceChange =
      existingTransaction.type === TransactionType.INCOME
        ? existingTransaction.amount
        : existingTransaction.amount.neg();

    const newBalanceChange =
      data.type === TransactionType.INCOME
        ? new Prisma.Decimal(data.amount)
        : new Prisma.Decimal(data.amount).neg();

    const balanceDifference = newBalanceChange.sub(oldBalanceChange);

    const newBalance =
      existingTransaction.account.balance.add(balanceDifference);

    if (newBalance.lessThan(0)) {
      throw new Error(ErrorCode.INSUFFICIENT_BALANCE);
    }

    // update transaction
    const updatedTransaction = await tx.transaction.update({
      where: { id },
      data: {
        ...data,
        accountId: existingTransaction.accountId, // prevent changing account
        nextRecurringDate:
          data.isRecurring && data.recurringInterval
            ? calculateNextRecurringDate(data.date, data.recurringInterval)
            : null,
      },
    });

    // update account balance
    await tx.account.update({
      where: { id: existingTransaction.accountId },
      data: {
        balance: { increment: balanceDifference },
      },
    });

    return {
      updatedTransaction,
      accountSnapshot: {
        userId,
        name: existingTransaction.account.name,
        type: existingTransaction.account.type,
        balance: existingTransaction.account.balance.add(balanceDifference),
      },
    };
  });
}

// bulk delete transactions
export async function bulkDeleteTransactions({
  transactionIds,
  userId,
}: bulkDeleteTransactionProps) {
  // fetch transactions to verify ownership
  const transactions = await prisma.transaction.findMany({
    where: {
      id: { in: transactionIds },
      userId,
    },
    include: { account: true },
  });

  if (transactions.length === 0) {
    throw new Error(ErrorCode.TRANSACTION_NOT_FOUND);
  }

  // Calculate balance changes per account

  /*
      Example result:
      {
        "account_1": 200,
        "account_2": -300
      }
    */

  const accountBalanceChanges: Record<string, Prisma.Decimal> = {};
  const accountSnapshots = new Map<string, any>();

  for (const tx of transactions) {
    const diff =
      tx.type === TransactionType.EXPENSE ? tx.amount : tx.amount.neg();

    accountBalanceChanges[tx.accountId] = (
      accountBalanceChanges[tx.accountId] || new Prisma.Decimal(0)
    ).plus(diff);

    accountSnapshots.set(tx.accountId, {
      userId,
      name: tx.account.name,
      type: tx.account.type,
      balance: tx.account.balance, // initial
    });
  }

  // Run delete + balance update inside a DB transaction
  // This ensures data consistency (all succeed or all rollback)

  await prisma.$transaction(async (tx) => {
    // Delete transactions
    await tx.transaction.deleteMany({
      where: {
        id: { in: transactionIds },
        userId,
      },
    });

    for (const [accountId, diff] of Object.entries(accountBalanceChanges)) {
      await tx.account.update({
        where: { id: accountId, userId },
        data: { balance: { increment: diff } },
      });

      accountSnapshots.get(accountId).balance = accountSnapshots
        .get(accountId)
        .balance.add(diff);
    }
  });

  return {
    deletedTransactions: transactions,
    accountSnapshots: Array.from(accountSnapshots.entries()),
  };
}

// ------------------------------------------------//
function normalizeDescription(text?: string | null) {
  return (text ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function calculateNet(rows: BulkTransactionParsedType) {
  return rows.reduce((sum, t) => {
    return t.type === "INCOME" ? sum.add(t.amount) : sum.sub(t.amount);
  }, new Prisma.Decimal(0));
}

export async function saveBulkTransactions(
  userId: string,
  rows: BulkTransactionParsedType,
  importId: string,
) {
  return await prisma.$transaction(async (tx) => {
    const accountId = rows[0].accountId;

    if (!accountId) {
      throw new Error(ErrorCode.ACCOUNT_NOT_FOUND);
    }

    //  Check if this import was already processed
    const existingImport = await tx.importJob.findUnique({
      where: { id_userId: { id: importId, userId } },
    });

    if (existingImport?.status === ImportJobStatus.SAVED) {
      // Import already processed → idempotent
      throw new Error(ErrorCode.IMPORT_JOB_ALREADY_PROCESSED);
    }

    //  find existing (possible duplicates)
    const existing = await tx.transaction.findMany({
      where: {
        userId,
        accountId,
        OR: rows.map((r) => ({
          date: r.date,
          amount: r.amount,
          description: normalizeDescription(r.description),
        })),
      },
      select: {
        date: true,
        amount: true,
        description: true,
      },
    });

    const existingSet = new Set(
      existing.map(
        (e) =>
          `${e.date.toISOString()}-${e.amount.toString()}-${normalizeDescription(e.description)}`,
      ),
    );

    //  keep only new rows
    const newRows = rows.filter(
      (r) =>
        !existingSet.has(
          `${r.date.toISOString()}-${r.amount.toString()}-${normalizeDescription(r.description)}`,
        ),
    );

    if (newRows.length === 0) return { skipped: true };

    //  insert only new transactions
    await tx.transaction.createMany({
      data: newRows.map((r) => ({
        userId,
        accountId,
        type: r.type,
        amount: r.amount,
        description: normalizeDescription(r.description),
        date: r.date,
        category: r.category,
        isRecurring: r.recurring !== "NONE",
        recurringInterval: r.recurring === "NONE" ? null : r.recurring,
      })),
    });

    //  update balance only for inserted rows
    const netBalanceChange = calculateNet(newRows);

    await tx.account.update({
      where: { id: accountId, userId },
      data: {
        balance: {
          increment: netBalanceChange,
        },
      },
    });

    //  update import job status
    await upsertImportJob({
      importJobId: importId,
      userId,
      status: ImportJobStatus.SAVED,
      tx,
      accountId,
    });

    return {
      skipped: false,
      inserted: newRows.length,
      rejected: rows.length - newRows.length,
    };
  });
}
