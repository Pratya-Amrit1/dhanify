"use server";

import { requireUser } from "@/lib/data/users/auth";
import { accountSchema } from "@/lib/schemas/account.schema";
import { revalidatePath } from "next/cache";
import { ErrorCode } from "@/lib/constants/error-codes";
import { mapDomainError } from "@/lib/utils/mapDomainError";
import {
  createAccount,
  deleteAccount,
  updateDefaultAccount,
} from "@/lib/data/accounts/mutations";
import { Prisma } from "@prisma/client";
import {
  ExportFormat,
  exportTransactions,
} from "@/lib/data/exports/export.data";
import { requireFeature } from "@/lib/data/users/subscription";
import { FEATURES } from "@/lib/config/features";
import { getAllTransactionsByAccountId } from "@/lib/data/accounts/queries";

type ResponseResult =
  | { success: true; message: string; accountId?: string }
  | { success: false; error: string };

export type ExportActionResult =
  | {
      success: true;
      data: string;
      mime: string;
      filename: string;
      message: string;
    }
  | { success: false; error: string };

// Action to create a new account
export async function createAccountAction(
  data: unknown,
): Promise<ResponseResult> {
  // SERVER-SIDE validation (MANDATORY)
  const parsed = accountSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: ErrorCode.INVALID_FORM_DATA };
  }

  try {
    const user = await requireUser();
    const { name, type, balance, isDefault } = parsed.data;

    const decimalBalance = new Prisma.Decimal(balance);

    // call service to create account
    const account = await createAccount({
      userId: user.id,
      name,
      type,
      balance: decimalBalance,
      isDefault,
    });

    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/transactions/create");

    return {
      success: true,
      message: "Account created successfully",
      accountId: account.id,
    };
  } catch (error) {
    // Map known domain errors
    const mapped = mapDomainError(error);

    // If error is known, normalize it to ResponseResult
    if (mapped) {
      return { success: false, error: mapped.error };
    }

    // If error is unknown, use ACCOUNT_CREATION_FAILED
    return { success: false, error: ErrorCode.ACCOUNT_CREATION_FAILED };
  }
}

// action to update default account
export async function updateDefaultAccountAction(
  accountId: string,
): Promise<ResponseResult> {
  try {
    const user = await requireUser();

    await updateDefaultAccount({
      userId: user.id,
      accountId,
    });

    revalidatePath("/accounts");
    revalidatePath("/dashboard");

    return { success: true, message: "Default account updated successfully" };
  } catch (error) {
    const mapped = mapDomainError(error);

    // If error is known, normalize it to ResponseResult
    if (mapped) {
      return { success: false, error: mapped.error };
    }
    // If error is unknown, use ACCOUNT_UPDATE_FAILED
    return { success: false, error: ErrorCode.ACCOUNT_UPDATE_FAILED };
  }
}

// Action to delete a single account
export async function deleteAccountAction(
  accountId: string,
): Promise<ResponseResult> {
  try {
    const user = await requireUser();

    await deleteAccount({ userId: user.id, accountId });

    revalidatePath("/accounts");
    revalidatePath("/transactions");

    return { success: true, message: "Account deleted successfully" };
  } catch (error) {
    // Map known domain errors
    const mapped = mapDomainError(error);

    // If error is known, normalize it to ResponseResult
    if (mapped) {
      return { success: false, error: mapped.error };
    }

    // If error is unknown, use ACCOUNT_DELETE_FAILED
    return { success: false, error: ErrorCode.ACCOUNT_DELETE_FAILED };
  }
}

// export account transactions
export const exportAccountTransactionAction = async (
  accountId: string,
  format: ExportFormat,
): Promise<ExportActionResult> => {
  try {
    await requireUser();

    const hasFeature = await requireFeature(FEATURES.CSV_EXCEL_EXPORT);
    if (!hasFeature) {
      return {
        success: false,
        error: "Upgrade to Pro to export transactions",
      };
    }

    const data = await getAllTransactionsByAccountId(accountId);
    if (!data || data.transactions.length === 0) {
      return {
        success: false,
        error: "No transactions to export",
      };
    }

    const exported = await exportTransactions(
      format,
      data.transactions,
      accountId,
    );

    return {
      success: true,
      ...exported,
      message: "Transactions exported successfully",
    };
  } catch (error) {
    // Map known domain errors
    const mapped = mapDomainError(error);

    // If error is known, normalize it to ResponseResult
    if (mapped) {
      return { success: false, error: mapped.error };
    }

    return {
      success: false,
      error: "failed to export transactions",
    };
  }
};
