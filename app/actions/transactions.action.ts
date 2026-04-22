"use server";

import { requireUser } from "@/lib/data/users/auth";
import { transactionSchema } from "@/lib/schemas/transaction.schema";
import { request } from "@arcjet/next";
import { aj } from "@/lib/arcjet";
import { revalidatePath } from "next/cache";
import { ErrorCode } from "@/lib/constants/error-codes";
import { mapDomainError } from "@/lib/utils/mapDomainError";
import { findAccountById } from "@/lib/data/transactions/queries";
import {
  createTransaction,
  updateTransaction,
} from "@/lib/data/transactions/mutations";
import { bulkDeleteTransactions } from "@/lib/data/transactions/mutations";
import { requireFeature } from "@/lib/data/users/subscription";
import { FEATURES } from "@/lib/config/features";
import { normalizeAiImportError } from "@/lib/utils/normalizeAiErrors";
import { inngest } from "@/inngest/client";

type ResponseResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function createTransactionAction(
  data: unknown,
  isReceiptScan: boolean,
  importId: string,
): Promise<ResponseResult> {
  const parsed = transactionSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: ErrorCode.INVALID_FORM_DATA };
  }

  try {
    const { accountId } = parsed.data;

    const user = await requireUser();

    // 🔐 PRO FEATURE CHECK
    if (parsed.data.isRecurring) {
      await requireFeature(FEATURES.RECURRING_TRANSACTIONS);
    }

    // arcjet
    const req = await request();
    const decision = await aj.protect(req, {
      userId: user.id,
      requested: 1,
    });

    if (decision.isDenied()) {
      throw new Error(ErrorCode.RATE_LIMITED);
    }

    const account = await findAccountById(accountId, user.id);

    if (!account) {
      throw new Error(ErrorCode.ACCOUNT_NOT_FOUND);
    }

    const transaction = await createTransaction({
      userId: user.id,
      account: { id: account.id, balance: account.balance },
      data: parsed.data,
      isReceiptScan,
      importId,
    });

    await inngest.send({
      name: "transaction.changed",
      data: {
        transaction: {
          id: transaction.id,
          userId: transaction.userId,
          accountId: transaction.accountId,
          date: transaction.date,
          accountName: account?.name,
          accountType: account?.type,
          accountBalance: account ? Number(account.balance) : undefined,
        },
      },
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath(`/accounts/${account.id}`);

    return {
      success: true,
      message: "Transaction created successfully",
    };
  } catch (error) {
    // Map known domain errors
    const mapped = mapDomainError(error);

    const aiError = normalizeAiImportError(error);

    const errorMessage = mapped?.error ?? aiError;

    if (mapped) {
      return { success: false, error: errorMessage };
    }
    // If error is unknown
    return { success: false, error: "Transaction creation failed" };
  }
}

// Bulk delete transactions for the Transactions dashboard
export async function bulkDeleteTransactionAction(
  transactionIds: string[],
): Promise<ResponseResult> {
  try {
    const user = await requireUser();

    const { deletedTransactions, accountSnapshots } =
      await bulkDeleteTransactions({ userId: user.id, transactionIds });

    const snapshotMap = new Map(accountSnapshots);

    await inngest.send(
      deletedTransactions.map((tx) => {
        const acc = snapshotMap.get(tx.accountId);
        return {
          name: "transaction.changed",
          data: {
            deleted: {
              userId: tx.userId,
              accountId: tx.accountId,
              date: tx.date,
              accountName: acc.name,
              accountType: acc.type,
              accountBalance: Number(acc.balance),
            },
          },
        };
      }),
    );

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/accounts/[id]", "page");

    return { success: true, message: "Transactions deleted successfully" };
  } catch (error) {
    const mapped = mapDomainError(error);
    if (mapped) {
      return { success: false, error: mapped.error };
    }
    return { success: false, error: ErrorCode.TRANSACTION_DELETE_FAILED };
  }
}

// update transaction
export async function updateTransactionAction(
  transactionId: string,
  data: unknown,
): Promise<ResponseResult> {
  const parsed = transactionSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(ErrorCode.INVALID_FORM_DATA);
  }

  try {
    const user = await requireUser();

    // pro feature check
    if (parsed.data.isRecurring) {
      await requireFeature(FEATURES.RECURRING_TRANSACTIONS);
    }

    const { updatedTransaction, accountSnapshot } = await updateTransaction({
      id: transactionId,
      userId: user.id,
      data: parsed.data,
    });

    await inngest.send({
      name: "transaction.changed",
      data: {
        transaction: {
          id: transactionId,
          userId: user.id,
          accountId: parsed.data.accountId,
          date: updatedTransaction.date,
          previousDate: updatedTransaction.date,
          accountName: accountSnapshot?.name,
          accountType: accountSnapshot?.type,
          accountBalance: accountSnapshot
            ? Number(accountSnapshot.balance)
            : undefined,
        },
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/accounts/${parsed.data.accountId}`, "page");
    revalidatePath("/transactions");

    return {
      success: true,
      message: "Transaction updated successfully",
    };
  } catch (error) {
    const mapped = mapDomainError(error);
    if (mapped) {
      return { success: false, error: mapped.error };
    }
    return { success: false, error: ErrorCode.TRANSACTION_UPDATE_FAILED };
  }
}
